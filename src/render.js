// State management
let isSelected = false;
let selectionCoordinates = null;

// NEW: OCR and reading state
let ocrData = null;
let isPlaying = false;
let currentParagraphIndex = 0;
let currentLineIndex = 0;
let currentWordIndex = 0;
let readingInterval = null;
let wordsPerMinute = 250; // Default WPM (adjustable in code for now)

// Get button references
const selectButton = document.getElementById('select-button');
// const refreshButton = document.getElementById('refresh-button');
const replayButton = document.getElementById('replay-button');
const playPauseButton = document.getElementById('play-pause-button');
const nextButton = document.getElementById('next-button');

// NEW: Get WPM control references
const wpmSlider = document.getElementById('wpm-slider');
const wpmInput = document.getElementById('wpm-input');

// Get display elements
const displayText = document.getElementById('display-text');

// NEW: Update display text with status message
function updateDisplayStatus(message, type = 'normal') {
  displayText.textContent = message;
  displayText.className = type; // Can be: normal, processing, error, success
}

// NEW: Display a word in the main display area with context
function displayWord(word, prevWord = null, nextWord = null) {
  // Clear and rebuild display
  displayText.innerHTML = '';
  displayText.className = 'word-display';
  
  // Create container for three-word display
  const container = document.createElement('div');
  container.className = 'word-context-container';
  
  // Previous word (if exists)
  if (prevWord) {
    const prevElement = document.createElement('div');
    prevElement.className = 'word-previous';
    prevElement.textContent = prevWord.text;
    container.appendChild(prevElement);
  }
  
  // Current word (main focus)
  const currentElement = document.createElement('div');
  currentElement.className = 'word-current';
  currentElement.textContent = word.text;
  container.appendChild(currentElement);
  
  // Next word (if exists)
  if (nextWord) {
    const nextElement = document.createElement('div');
    nextElement.className = 'word-next';
    nextElement.textContent = nextWord.text;
    container.appendChild(nextElement);
  }
  
  displayText.appendChild(container);
}

// NEW: Get word at specific position (helper function)
function getWordAt(paragraphIdx, lineIdx, wordIdx) {
  if (!ocrData || !ocrData.paragraphs.length) return null;
  if (paragraphIdx >= ocrData.paragraphs.length) return null;
  
  const paragraph = ocrData.paragraphs[paragraphIdx];
  if (!paragraph || lineIdx >= paragraph.lines.length) return null;
  
  const line = paragraph.lines[lineIdx];
  if (!line || wordIdx >= line.words.length) return null;
  
  return line.words[wordIdx];
}

// NEW: Get previous word
function getPreviousWord() {
  // Try previous word in same line
  if (currentWordIndex > 0) {
    return getWordAt(currentParagraphIndex, currentLineIndex, currentWordIndex - 1);
  }
  
  // Try last word of previous line
  if (currentLineIndex > 0) {
    const prevLine = ocrData.paragraphs[currentParagraphIndex].lines[currentLineIndex - 1];
    if (prevLine && prevLine.words.length > 0) {
      return prevLine.words[prevLine.words.length - 1];
    }
  }
  
  return null;
}

// NEW: Get next word
function getNextWord() {
  if (!ocrData || !ocrData.paragraphs.length) return null;
  
  const paragraph = ocrData.paragraphs[currentParagraphIndex];
  const line = paragraph.lines[currentLineIndex];
  
  // Try next word in same line
  if (currentWordIndex + 1 < line.words.length) {
    return getWordAt(currentParagraphIndex, currentLineIndex, currentWordIndex + 1);
  }
  
  // Try first word of next line
  if (currentLineIndex + 1 < paragraph.lines.length) {
    const nextLine = paragraph.lines[currentLineIndex + 1];
    if (nextLine && nextLine.words.length > 0) {
      return nextLine.words[0];
    }
  }
  
  return null;
}

// NEW: Calculate delay between words based on WPM
function getWordDelay() {
  return (60 / wordsPerMinute) * 1000; // Convert to milliseconds
}

// NEW: Get current word from OCR data
function getCurrentWord() {
  if (!ocrData || !ocrData.paragraphs.length) return null;
  
  const paragraph = ocrData.paragraphs[currentParagraphIndex];
  if (!paragraph || !paragraph.lines.length) return null;
  
  const line = paragraph.lines[currentLineIndex];
  if (!line || !line.words.length) return null;
  
  return line.words[currentWordIndex];
}

// NEW: Advance to next word
function advanceWord() {
  if (!ocrData || !ocrData.paragraphs.length) return false;
  
  const paragraph = ocrData.paragraphs[currentParagraphIndex];
  const line = paragraph.lines[currentLineIndex];
  
  // Move to next word
  currentWordIndex++;
  
  // Check if we need to move to next line
  if (currentWordIndex >= line.words.length) {
    currentWordIndex = 0;
    currentLineIndex++;
    
    // Check if we've reached end of current paragraph
    if (currentLineIndex >= paragraph.lines.length) {
      // End of paragraph reached - stop here
      stopReading();
      
      // Go back to last word of paragraph to keep it displayed
      currentLineIndex = paragraph.lines.length - 1;
      const lastLine = paragraph.lines[currentLineIndex];
      currentWordIndex = lastLine.words.length - 1;
      
      // Display the last word with context
      const currentWord = getCurrentWord();
      const prevWord = getPreviousWord();
      const nextWord = getNextWord();
      
      if (currentWord) {
        displayWord(currentWord, prevWord, nextWord);
      }
      
      // Check if there are more paragraphs
      if (currentParagraphIndex + 1 < ocrData.paragraphs.length) {
        console.log('Paragraph complete. Press ▶ to replay or Next for next paragraph.');
      } else {
        console.log('All text complete. Press ▶ to replay or Refresh to scan new text.');
      }
      
      return false;
    }
  }
  
  return true;
}

// NEW: Start reading words
function startReading() {
  if (isPlaying) return; // Already playing
  if (!ocrData || !ocrData.paragraphs.length) {
    updateDisplayStatus('No text to read', 'error');
    return;
  }
  
  // Check if we're at the end of a paragraph, reset to beginning for replay
  const paragraph = ocrData.paragraphs[currentParagraphIndex];
  if (currentLineIndex === paragraph.lines.length - 1) {
    const lastLine = paragraph.lines[currentLineIndex];
    if (currentWordIndex === lastLine.words.length - 1) {
      // We're at the last word, reset to beginning of paragraph for replay
      currentLineIndex = 0;
      currentWordIndex = 0;
    }
  }
  
  isPlaying = true;
  playPauseButton.textContent = '❚❚';
  
  // Display current word with context immediately
  const currentWord = getCurrentWord();
  const prevWord = getPreviousWord();
  const nextWord = getNextWord();
  
  if (currentWord) {
    displayWord(currentWord, prevWord, nextWord);
  }
  
  // Start interval for next words
  readingInterval = setInterval(() => {
    const hasNext = advanceWord();
    if (hasNext) {
      const currentWord = getCurrentWord();
      const prevWord = getPreviousWord();
      const nextWord = getNextWord();
      
      if (currentWord) {
        displayWord(currentWord, prevWord, nextWord);
      }
    }
  }, getWordDelay());
}

// NEW: Stop reading words
function stopReading() {
  if (!isPlaying) return;
  
  isPlaying = false;
  playPauseButton.textContent = '▶';
  
  if (readingInterval) {
    clearInterval(readingInterval);
    readingInterval = null;
  }
}

// NEW: Restart reading with new WPM (called when WPM changes during playback)
function restartReading() {
  if (!isPlaying) return;
  
  // Clear old interval
  if (readingInterval) {
    clearInterval(readingInterval);
  }
  
  // Start new interval with updated WPM
  readingInterval = setInterval(() => {
    const hasNext = advanceWord();
    if (hasNext) {
      const currentWord = getCurrentWord();
      const prevWord = getPreviousWord();
      const nextWord = getNextWord();
      
      if (currentWord) {
        displayWord(currentWord, prevWord, nextWord);
      }
    }
  }, getWordDelay());
}

// NEW: Reset reading position to beginning
function resetReading() {
  currentParagraphIndex = 0;
  currentLineIndex = 0;
  currentWordIndex = 0;
}

// NEW: Move to next line or paragraph
function nextLine() {
  stopReading();
  
  if (!ocrData || !ocrData.paragraphs.length) return;
  
  // Move to next paragraph
  currentParagraphIndex++;
  currentLineIndex = 0;
  currentWordIndex = 0;
  
  // Check if we've reached end of all paragraphs
  if (currentParagraphIndex >= ocrData.paragraphs.length) {
    updateDisplayStatus('No more paragraphs. Press Refresh to scan new text.', 'success');
    currentParagraphIndex = ocrData.paragraphs.length - 1; // Stay at last paragraph
    return;
  }
  
  // Display first word of next paragraph with context
  const currentWord = getCurrentWord();
  const prevWord = getPreviousWord();
  const nextWord = getNextWord();
  
  if (currentWord) {
    displayWord(currentWord, prevWord, nextWord);
  }
}

// NEW: Go back 2 lines (replay)
function replayLines() {
  stopReading();
  
  if (!ocrData || !ocrData.paragraphs.length) return;
  
  // Go back 2 lines
  currentLineIndex = Math.max(0, currentLineIndex - 2);
  currentWordIndex = 0;
  
  // Display first word of that line with context
  const currentWord = getCurrentWord();
  const prevWord = getPreviousWord();
  const nextWord = getNextWord();
  
  if (currentWord) {
    displayWord(currentWord, prevWord, nextWord);
  }
}

// Handle Select/Clear Selection button click
selectButton.addEventListener('click', () => {
  if (!isSelected) {
    // Start selection
    window.electronAPI.startSelection();
  } else {
    // Clear selection
    window.electronAPI.clearSelection();
  }
});

// refreshButton.addEventListener('click', () => {
//   if (isSelected && selectionCoordinates) {
//     // Stop any ongoing reading
//     stopReading();
//     resetReading();
    
//     // Request new OCR scan with existing coordinates
//     window.electronAPI.refreshOCR();
    
//     // Update display
//     updateDisplayStatus('Re-scanning text...', 'processing');
//   }
// });

// NEW: Handle Replay button click
replayButton.addEventListener('click', () => {
  if (!ocrData) {
    updateDisplayStatus('Please select an area first', 'error');
    return;
  }
  
  replayLines();
});

// NEW: Handle Play/Pause button
playPauseButton.addEventListener('click', () => {
  if (!ocrData) {
    updateDisplayStatus('Please select an area first', 'error');
    return;
  }
  
  if (isPlaying) {
    stopReading();
  } else {
    startReading();
  }
});

// NEW: Handle Next button
nextButton.addEventListener('click', () => {
  if (!ocrData) {
    updateDisplayStatus('Please select an area first', 'error');
    return;
  }
  
  nextLine();
});

// NEW: Handle WPM slider change
wpmSlider.addEventListener('input', (e) => {
  wordsPerMinute = parseInt(e.target.value);
  wpmInput.value = wordsPerMinute;
  
  // If currently playing, restart with new timing
  if (isPlaying) {
    restartReading();
  }
});

// NEW: Handle WPM input change
wpmInput.addEventListener('input', (e) => {
  let value = parseInt(e.target.value);
  
  // Clamp value between min and max
  if (value < 100) value = 100;
  if (value > 600) value = 600;
  
  wordsPerMinute = value;
  wpmSlider.value = value;
  
  // If currently playing, restart with new timing
  if (isPlaying) {
    restartReading();
  }
});

// NEW: Handle WPM input blur (fix invalid values)
wpmInput.addEventListener('blur', (e) => {
  let value = parseInt(e.target.value);
  
  if (isNaN(value) || value < 100) {
    value = 100;
  } else if (value > 600) {
    value = 600;
  }
  
  wordsPerMinute = value;
  wpmSlider.value = value;
  wpmInput.value = value;
});

// Listen for selection stored event from main process
window.electronAPI.onSelectionStored((coordinates) => {
  isSelected = true;
  selectionCoordinates = coordinates;
  selectButton.textContent = 'clear';
  
  // Update status to show OCR is starting
  updateDisplayStatus('Processing text...', 'processing');

  console.log('Selection stored:', coordinates);
});

// Listen for selection cleared event from main process
window.electronAPI.onSelectionCleared(() => {
  isSelected = false;
  selectionCoordinates = null;
  selectButton.textContent = 'select';
  
  // NEW: Disable refresh and replay buttons when no selection
  // refreshButton.disabled = true;
  replayButton.disabled = true;
  
  // NEW: Reset OCR data and reading state
  ocrData = null;
  stopReading();
  resetReading();
  updateDisplayStatus('ready to start', 'normal');

  console.log('Selection cleared');
});

// NEW: Listen for OCR processing event
window.electronAPI.onOCRProcessing(() => {
  updateDisplayStatus('Scanning text... 0%', 'processing');
  console.log('OCR processing started');
});

// NEW: Listen for OCR progress updates
window.electronAPI.onOCRProgress((progress) => {
  updateDisplayStatus(`Scanning text... ${progress}%`, 'processing');
  console.log(`OCR progress: ${progress}%`);
});

// NEW: Listen for OCR complete event
window.electronAPI.onOCRComplete((data) => {
  console.log('OCR complete, received data:', data);
  ocrData = data;
  
  // Reset reading position
  resetReading();
  
  // Display first word with context
  if (data.paragraphs.length > 0 && 
      data.paragraphs[0].lines.length > 0 && 
      data.paragraphs[0].lines[0].words.length > 0) {
    
    const currentWord = getCurrentWord();
    const prevWord = getPreviousWord(); // Will be null for first word
    const nextWord = getNextWord();
    
    if (currentWord) {
      displayWord(currentWord, prevWord, nextWord);
    }
  } else {
    updateDisplayStatus('No text detected. Try selecting a different area.', 'error');
  }
  
  // Enable play/pause, next, and replay buttons
  playPauseButton.disabled = false;
  nextButton.disabled = false;
  replayButton.disabled = false;
});

// NEW: Listen for OCR error event
window.electronAPI.onOCRError((error) => {
  console.error('OCR error:', error);
  updateDisplayStatus(`Error: ${error}`, 'error');
  ocrData = null;
});

// ESC key handler to clear selection
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isSelected) {
    window.electronAPI.clearSelection();
  }
  
  // NEW: Space bar to play/pause
  if (e.key === ' ' && ocrData) {
    e.preventDefault();
    if (isPlaying) {
      stopReading();
    } else {
      startReading();
    }
  }
});