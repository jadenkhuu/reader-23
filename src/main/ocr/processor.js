const Tesseract = require('tesseract.js');
const path = require('node:path');
const fs = require('fs');
const { OCR_CONFIG, IPC_CHANNELS } = require('../../shared/constants');

// Store OCR data
let ocrData = {
  paragraphs: [],
  rawText: '',
  isProcessing: false
};

// Get OCR data
function getOcrData() {
  return ocrData;
}

// Reset OCR data
function resetOcrData() {
  ocrData = {
    paragraphs: [],
    rawText: '',
    isProcessing: false
  };
}

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
  const hasDash = /[—–]/.test(text);

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

// Extract structured data from Tesseract result
function extractStructuredData(tesseractData, selectionCoords) {
  const paragraphs = [];

  console.log('Extracting structured data...');
  console.log('Tesseract data keys:', Object.keys(tesseractData));

  // Helper to process words with splitting
  const processWords = (words) => {
    const processed = [];
    words.forEach((word, wordIndex) => {
      const splitWords = splitWordOnSpecialChars({
        id: wordIndex,
        text: word.text,
        bbox: word.bbox,
        confidence: word.confidence
      });
      processed.push(...splitWords);
    });
    return processed;
  };

  // Helper to create line data
  const createLineData = (line, lineIndex) => ({
    id: lineIndex,
    bbox: line.bbox || { x: 0, y: 0, width: 0, height: 0 },
    text: line.text,
    confidence: line.confidence,
    words: line.words ? processWords(line.words) : []
  });

  // Strategy 1: Use lines with smart paragraph detection
  if (tesseractData.lines?.length > 0) {
    console.log('Found', tesseractData.lines.length, 'lines');

    const lineGroups = [];
    let currentGroup = [];
    let previousLineBottom = null;

    tesseractData.lines.forEach((line) => {
      if (!line.text || line.text.trim().length < 2) {
        if (currentGroup.length > 0) {
          lineGroups.push(currentGroup);
          currentGroup = [];
          previousLineBottom = null;
        }
        return;
      }

      if (previousLineBottom !== null && line.bbox) {
        const gap = line.bbox.y0 - previousLineBottom;
        const avgLineHeight = line.bbox.y1 - line.bbox.y0;

        if (gap > avgLineHeight * OCR_CONFIG.PARAGRAPH_GAP_MULTIPLIER) {
          if (currentGroup.length > 0) {
            lineGroups.push(currentGroup);
            currentGroup = [];
          }
        }
      }

      currentGroup.push(line);
      if (line.bbox) previousLineBottom = line.bbox.y1;
    });

    if (currentGroup.length > 0) lineGroups.push(currentGroup);

    console.log('Detected', lineGroups.length, 'paragraph groups');

    lineGroups.forEach((group, groupIndex) => {
      paragraphs.push({
        id: `${groupIndex}`,
        bbox: group[0].bbox || { x: 0, y: 0, width: 0, height: 0 },
        confidence: tesseractData.confidence,
        lines: group.map(createLineData)
      });
    });
  }
  // Strategy 2: Use blocks/paragraphs structure
  else if (tesseractData.blocks) {
    console.log('Using blocks structure');
    tesseractData.blocks.forEach((block, blockIndex) => {
      block.paragraphs?.forEach((para, paraIndex) => {
        paragraphs.push({
          id: `${blockIndex}-${paraIndex}`,
          bbox: para.bbox,
          confidence: para.confidence,
          lines: para.lines?.map(createLineData) || []
        });
      });
    });
  }
  // Strategy 3: Plain text fallback
  else if (tesseractData.text) {
    console.log('Falling back to plain text parsing');

    tesseractData.text
      .split(/\n\s*\n/)
      .filter(p => p.trim().length > 0)
      .forEach((paraText, paraIndex) => {
        const lines = paraText.split('\n').filter(line => line.trim().length > 0);

        paragraphs.push({
          id: `${paraIndex}`,
          bbox: { x: 0, y: 0, width: 0, height: 0 },
          confidence: tesseractData.confidence,
          lines: lines.map((lineText, lineIndex) => ({
            id: lineIndex,
            bbox: { x: 0, y: 0, width: 0, height: 0 },
            text: lineText,
            confidence: tesseractData.confidence,
            words: processWords(
              lineText.trim().split(/\s+/).map((text, i) => ({
                id: i,
                text,
                bbox: { x: 0, y: 0, width: 0, height: 0 },
                confidence: tesseractData.confidence
              }))
            )
          }))
        });
      });
  }

  console.log('Extracted', paragraphs.length, 'paragraphs with',
    paragraphs.reduce((sum, p) => sum + p.lines.length, 0), 'total lines');

  return {
    paragraphs,
    fullText: tesseractData.text,
    confidence: tesseractData.confidence,
    selectionCoordinates: selectionCoords
  };
}

// Process OCR on captured screenshot using Worker
async function processOCR(imageBuffer, coordinates, mainWindow) {
  try {
    console.log('Starting OCR processing...');
    ocrData.isProcessing = true;

    // Notify renderer that OCR is processing
    mainWindow.webContents.send(IPC_CHANNELS.OCR_PROCESSING);

    // Create a Tesseract worker for non-blocking OCR
    const worker = await Tesseract.createWorker(OCR_CONFIG.LANGUAGE, OCR_CONFIG.WORKER_COUNT, {
      logger: m => {
        console.log(m);
        // Send progress updates to renderer
        if (m.status === 'recognizing text') {
          mainWindow.webContents.send(IPC_CHANNELS.OCR_PROGRESS, Math.round(m.progress * 100));
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
    fs.writeFileSync(
      path.join(__dirname, '../../ocr-output.json'),
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

module.exports = {
  processOCR,
  getOcrData,
  resetOcrData
};
