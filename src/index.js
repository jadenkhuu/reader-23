const { app, BrowserWindow, ipcMain, screen, desktopCapturer } = require('electron');
const path = require('node:path');
const Tesseract = require('tesseract.js'); // NEW: Import Tesseract for OCR

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Store references to windows
let mainWindow;
let overlayWindow = null;
let borderWindow = null;

// Store selection state
let selectionState = {
  isSelected: false,
  coordinates: null
};

// NEW: Store OCR data
let ocrData = {
  paragraphs: [],
  rawText: '',
  isProcessing: false
};

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 407,
    height: 600,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

// Create overlay window for screen selection
function createOverlayWindow() {
    if (overlayWindow) {
    overlayWindow.focus();
    return;
  }

  const mainWindowBounds = mainWindow.getBounds();
  const currentDisplay = screen.getDisplayMatching(mainWindowBounds);

  overlayWindow = new BrowserWindow({
    x: currentDisplay.bounds.x,
    y: currentDisplay.bounds.y,
    width: currentDisplay.bounds.width,
    height: currentDisplay.bounds.height,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload-overlay.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  overlayWindow.loadFile(path.join(__dirname, 'overlay.html'));

  // Handle overlay window close
  overlayWindow.on('closed', () => {
    overlayWindow = null;
  });
}

// Create border window to show the selection
function createBorderWindow(coordinates) {
  // Close existing border window if any
  if (borderWindow) {
    borderWindow.close();
  }
  // Get the display where the overlay was shown
  const mainWindowBounds = mainWindow.getBounds();
  const currentDisplay = screen.getDisplayMatching(mainWindowBounds);

  // Adjust coordinates to be absolute (add display offset)
  const absoluteX = currentDisplay.bounds.x + coordinates.x;
  const absoluteY = currentDisplay.bounds.y + coordinates.y;

  borderWindow = new BrowserWindow({
    x: absoluteX,
    y: absoluteY,
    width: coordinates.width,
    height: coordinates.height,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    focusable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  // Make the window click-through
  borderWindow.setIgnoreMouseEvents(true);

  borderWindow.loadFile(path.join(__dirname, 'border.html'));

  // Handle border window close
  borderWindow.on('closed', () => {
    borderWindow = null;
  });
}

// NEW: Capture screenshot of selected area
async function captureSelectedArea(coordinates) {
  try {
    console.log('Capturing screenshot of selected area...', coordinates);
    
    // Get the display where the selection was made
    const mainWindowBounds = mainWindow.getBounds();
    const currentDisplay = screen.getDisplayMatching(mainWindowBounds);
    
    // Calculate scale factor for high DPI displays
    const scaleFactor = currentDisplay.scaleFactor || 1;
    
    // Get all available sources with appropriate size
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: {
        width: currentDisplay.bounds.width * scaleFactor,
        height: currentDisplay.bounds.height * scaleFactor
      }
    });

    console.log('Found sources:', sources.length);

    if (!sources || sources.length === 0) {
      throw new Error('No screen source found');
    }

    // Use the first source (main screen capture)
    const source = sources[0];
    const screenshot = source.thumbnail;
    
    console.log('Screenshot size:', screenshot.getSize());
    
    // Crop to selected area
    // Adjust coordinates for scale factor
    const cropArea = {
      x: Math.round(coordinates.x * scaleFactor),
      y: Math.round(coordinates.y * scaleFactor),
      width: Math.round(coordinates.width * scaleFactor),
      height: Math.round(coordinates.height * scaleFactor)
    };
    
    console.log('Crop area:', cropArea);
    
    // Crop the screenshot
    const croppedImage = screenshot.crop(cropArea);
    
    // Resize if too large (optimization for OCR)
    const maxDimension = 1920;
    let finalImage = croppedImage;
    if (croppedImage.getSize().width > maxDimension || croppedImage.getSize().height > maxDimension) {
      const aspectRatio = croppedImage.getSize().width / croppedImage.getSize().height;
      const newWidth = aspectRatio > 1 ? maxDimension : Math.round(maxDimension * aspectRatio);
      const newHeight = aspectRatio > 1 ? Math.round(maxDimension / aspectRatio) : maxDimension;
      
      finalImage = croppedImage.resize({ 
        width: newWidth, 
        height: newHeight,
        quality: 'good'
      });
      console.log('Resized to:', finalImage.getSize());
    }
    
    // Convert to PNG buffer
    const imageBuffer = finalImage.toPNG();
    
    console.log('Image buffer size:', imageBuffer.length, 'bytes');
    
    // DEBUG: Save cropped image to file for inspection
    const fs = require('fs');
    const debugPath = path.join(__dirname, 'debug-screenshot.png');
    fs.writeFileSync(debugPath, imageBuffer);
    console.log('Debug screenshot saved to:', debugPath);
    
    return imageBuffer;
  } catch (error) {
    console.error('Screenshot capture error:', error);
    throw error;
  }
}

// NEW: Process OCR on captured screenshot using Worker
async function processOCR(imageBuffer, coordinates) {
  try {
    console.log('Starting OCR processing...');
    ocrData.isProcessing = true;
    
    // Notify renderer that OCR is processing
    mainWindow.webContents.send('ocr-processing');

    // Create a Tesseract worker for non-blocking OCR
    const worker = await Tesseract.createWorker('eng', 1, {
      logger: m => {
        console.log(m);
        // Send progress updates to renderer
        if (m.status === 'recognizing text') {
          mainWindow.webContents.send('ocr-progress', Math.round(m.progress * 100));
        }
      }
    });

    // Run Tesseract OCR with worker
    const result = await worker.recognize(imageBuffer);
    
    // Terminate worker to free resources
    await worker.terminate();

    console.log('OCR complete!');
    console.log('Confidence:', result.data.confidence);

    // Extract structured data from Tesseract result
    const structuredData = extractStructuredData(result.data, coordinates);
    
    // Store OCR data
    ocrData.paragraphs = structuredData.paragraphs;
    ocrData.rawText = result.data.text;
    ocrData.isProcessing = false;

    // Save to JSON file for debugging
    const fs = require('fs');
    fs.writeFileSync(
      path.join(__dirname, 'ocr-output.json'),
      JSON.stringify(structuredData, null, 2)
    );
    console.log('OCR data saved to ocr-output.json');

    return structuredData;
  } catch (error) {
    console.error('OCR processing error:', error);
    ocrData.isProcessing = false;
    throw error;
  }
}

// NEW: Extract structured data from Tesseract result
function extractStructuredData(tesseractData, selectionCoords) {
  const paragraphs = [];
  
  console.log('Extracting structured data...');
  console.log('Tesseract data keys:', Object.keys(tesseractData));
  
  // Helper function to split words on special characters
  function splitWordOnSpecialChars(word) {
    const words = [];
    const text = word.text;
    
    // Debug: Log the word and its character codes
    console.log('Processing word:', text);
    if (text.length < 30) { // Only log short words to avoid spam
      console.log('Character codes:', text.split('').map(c => c.charCodeAt(0)));
    }
    
    // Check for various dash characters
    // Em-dash: — (U+2014, code 8212)
    // En-dash: – (U+2013, code 8211)
    // Regular hyphen: - (U+002D, code 45)
    const hasDash = /[—–\-]/.test(text);
    
    if (!hasDash) {
      // No dashes found, return original word
      return [word];
    }
    
    console.log('Found dash in word, splitting...');
    
    // Split on any dash-like character
    let currentPart = '';
    let partIndex = 0;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const charCode = char.charCodeAt(0);
      
      // Check if this is any kind of dash
      // Em-dash: 8212, En-dash: 8211, Hyphen: 45
      const isDash = charCode === 8212 || charCode === 8211 || charCode === 45;
      
      if (isDash) {
        // Save current part if not empty
        if (currentPart.length > 0) {
          words.push({
            id: word.id + '_' + partIndex++,
            text: currentPart,
            bbox: word.bbox,
            confidence: word.confidence
          });
          console.log('  Added part:', currentPart);
        }
        
        // Save the dash as separate word
        words.push({
          id: word.id + '_' + partIndex++,
          text: char,
          bbox: word.bbox,
          confidence: word.confidence
        });
        console.log('  Added dash:', char, 'code:', charCode);
        
        currentPart = '';
      } else {
        currentPart += char;
      }
    }
    
    // Don't forget the last part
    if (currentPart.length > 0) {
      words.push({
        id: word.id + '_' + partIndex++,
        text: currentPart,
        bbox: word.bbox,
        confidence: word.confidence
      });
      console.log('  Added final part:', currentPart);
    }
    
    console.log('Split into', words.length, 'words');
    return words.length > 0 ? words : [word];
  }
  
  // Check if we have lines data (most reliable)
  if (tesseractData.lines && tesseractData.lines.length > 0) {
    console.log('Found', tesseractData.lines.length, 'lines');
    
    // Detect paragraph breaks by analyzing vertical gaps between lines
    const lineGroups = [];
    let currentGroup = [];
    let previousLineBottom = null;
    
    tesseractData.lines.forEach((line, index) => {
      // Skip empty or very short lines (likely noise)
      if (!line.text || line.text.trim().length < 2) {
        // If we have accumulated lines, save as paragraph and start new one
        if (currentGroup.length > 0) {
          lineGroups.push(currentGroup);
          currentGroup = [];
          previousLineBottom = null;
        }
        return;
      }
      
      // Calculate gap between lines
      if (previousLineBottom !== null && line.bbox) {
        const gap = line.bbox.y0 - previousLineBottom;
        const avgLineHeight = (line.bbox.y1 - line.bbox.y0);
        
        // If gap is more than 1.5x average line height, it's likely a paragraph break
        if (gap > avgLineHeight * 1.5) {
          if (currentGroup.length > 0) {
            lineGroups.push(currentGroup);
            currentGroup = [];
          }
        }
      }
      
      currentGroup.push(line);
      if (line.bbox) {
        previousLineBottom = line.bbox.y1;
      }
    });
    
    // Don't forget the last group
    if (currentGroup.length > 0) {
      lineGroups.push(currentGroup);
    }
    
    console.log('Detected', lineGroups.length, 'paragraph groups');
    
    // Convert each group into a paragraph
    lineGroups.forEach((group, groupIndex) => {
      const paragraphData = {
        id: `${groupIndex}`,
        bbox: group[0].bbox || { x: 0, y: 0, width: 0, height: 0 },
        confidence: tesseractData.confidence,
        lines: []
      };

      // Process each line in the group
      group.forEach((line, lineIndex) => {
        const lineData = {
          id: lineIndex,
          bbox: line.bbox,
          text: line.text,
          confidence: line.confidence,
          words: []
        };

        // Extract words from line
        if (line.words && line.words.length > 0) {
          line.words.forEach((word, wordIndex) => {
            // Split words that contain em-dashes or other special chars
            const splitWords = splitWordOnSpecialChars({
              id: wordIndex,
              text: word.text,
              bbox: word.bbox,
              confidence: word.confidence
            });
            
            // Add all split words
            splitWords.forEach(splitWord => {
              lineData.words.push(splitWord);
            });
          });
        }

        paragraphData.lines.push(lineData);
      });

      paragraphs.push(paragraphData);
    });
  } 
  // Fallback: Try blocks/paragraphs structure
  else if (tesseractData.blocks) {
    console.log('Using blocks structure');
    tesseractData.blocks.forEach((block, blockIndex) => {
      if (block.paragraphs) {
        block.paragraphs.forEach((para, paraIndex) => {
          const paragraphData = {
            id: `${blockIndex}-${paraIndex}`,
            bbox: para.bbox,
            confidence: para.confidence,
            lines: []
          };

          // Extract lines
          if (para.lines) {
            para.lines.forEach((line, lineIndex) => {
              const lineData = {
                id: lineIndex,
                bbox: line.bbox,
                text: line.text,
                confidence: line.confidence,
                words: []
              };

              // Extract words
              if (line.words) {
                line.words.forEach((word, wordIndex) => {
                  lineData.words.push({
                    id: wordIndex,
                    text: word.text,
                    bbox: word.bbox,
                    confidence: word.confidence
                  });
                });
              }

              paragraphData.lines.push(lineData);
            });
          }

          paragraphs.push(paragraphData);
        });
      }
    });
  }
  // Last resort: Parse from plain text
  else if (tesseractData.text) {
    console.log('Falling back to plain text parsing');
    
    // Split by double newlines to detect paragraphs
    const paragraphTexts = tesseractData.text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    paragraphTexts.forEach((paraText, paraIndex) => {
      const lines = paraText.split('\n').filter(line => line.trim().length > 0);
      
      const paragraphData = {
        id: `${paraIndex}`,
        bbox: { x: 0, y: 0, width: 0, height: 0 },
        confidence: tesseractData.confidence,
        lines: []
      };

      lines.forEach((lineText, lineIndex) => {
        const words = lineText.trim().split(/\s+/);
        const lineData = {
          id: lineIndex,
          bbox: { x: 0, y: 0, width: 0, height: 0 },
          text: lineText,
          confidence: tesseractData.confidence,
          words: []
        };

        words.forEach((wordText, wordIndex) => {
          lineData.words.push({
            id: wordIndex,
            text: wordText,
            bbox: { x: 0, y: 0, width: 0, height: 0 },
            confidence: tesseractData.confidence
          });
        });

        paragraphData.lines.push(lineData);
      });

      paragraphs.push(paragraphData);
    });
  }

  console.log('Extracted', paragraphs.length, 'paragraphs with', 
    paragraphs.reduce((sum, p) => sum + p.lines.length, 0), 'total lines');

  return {
    paragraphs: paragraphs,
    fullText: tesseractData.text,
    confidence: tesseractData.confidence,
    selectionCoordinates: selectionCoords
  };
}

// IPC Handlers

// Handle start selection request
ipcMain.on('start-selection', () => {
  console.log('Start selection requested');
  createOverlayWindow();
});

// Handle selection complete
ipcMain.on('selection-complete', async (event, coordinates) => {
  console.log('Selection complete:', coordinates);

  // Store coordinates
  selectionState.isSelected = true;
  selectionState.coordinates = coordinates;

  // Close overlay window
  if (overlayWindow) {
    overlayWindow.close();
  }

  // Create border window to show the selection
  createBorderWindow(coordinates);

  // Ensure border window stays on top
  mainWindow.setAlwaysOnTop(true, 'floating');

  // Notify main window that selection is stored
  mainWindow.webContents.send('selection-stored', coordinates);

  // NEW: Start OCR processing automatically
  try {
    const screenshot = await captureSelectedArea(coordinates);
    const ocrResult = await processOCR(screenshot, coordinates);
    
    // Send OCR result to renderer
    mainWindow.webContents.send('ocr-complete', ocrResult);
    console.log('OCR result sent to renderer');
  } catch (error) {
    console.error('Error in OCR pipeline:', error);
    mainWindow.webContents.send('ocr-error', error.message);
  }
});

// Handle selection cancelled
ipcMain.on('selection-cancelled', () => {
  console.log('Selection cancelled');

  // Close overlay window
  if (overlayWindow) {
    overlayWindow.close();
  }
});

// Handle clear selection request
ipcMain.on('clear-selection', () => {
  console.log('Clear selection requested');

  // Clear stored coordinates
  selectionState.isSelected = false;
  selectionState.coordinates = null;

  // NEW: Clear OCR data
  ocrData = {
    paragraphs: [],
    rawText: '',
    isProcessing: false
  };

  // Close border window
  if (borderWindow) {
    borderWindow.close();
  }

  mainWindow.setAlwaysOnTop(true);

  // Notify main window
  mainWindow.webContents.send('selection-cleared');
});

// NEW: Handle refresh OCR request
ipcMain.on('refresh-ocr', async () => {
  console.log('Refresh OCR requested');
  
  // Check if we have a selection
  if (!selectionState.isSelected || !selectionState.coordinates) {
    console.error('No selection to refresh');
    mainWindow.webContents.send('ocr-error', 'No selection to refresh');
    return;
  }
  
  // Re-run OCR with existing coordinates
  try {
    const screenshot = await captureSelectedArea(selectionState.coordinates);
    const ocrResult = await processOCR(screenshot, selectionState.coordinates);
    
    // Send OCR result to renderer
    mainWindow.webContents.send('ocr-complete', ocrResult);
    console.log('OCR refresh complete');
  } catch (error) {
    console.error('Error in OCR refresh:', error);
    mainWindow.webContents.send('ocr-error', error.message);
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.