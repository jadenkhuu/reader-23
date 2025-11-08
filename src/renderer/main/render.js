// State management
let isSelected = false;
let selectionCoordinates = null;

// OCR and reading state
let ocrData = null;
let isPlaying = false;
let currentParagraphIndex = 0;
let currentLineIndex = 0;
let currentWordIndex = 0;
let readingInterval = null;
let wordsPerMinute = 250; // Default WPM (adjustable in code for now)

function isSentenceEnder(word) {
  if (!word || !word.text) return false;
  
  const text = word.text.trim();
  const lastChar = text[text.length - 1];
  
  // Check for sentence-ending punctuation
  return lastChar === '.' || 
         lastChar === '?' || 
         lastChar === '!' || 
         lastChar === '…'; // ellipsis
}

// Get word at specific position (helper function)
function getWordAt(paragraphIdx, lineIdx, wordIdx) {
  if (!ocrData || !ocrData.paragraphs.length) return null;
  if (paragraphIdx >= ocrData.paragraphs.length) return null;

  const paragraph = ocrData.paragraphs[paragraphIdx];
  if (!paragraph || lineIdx >= paragraph.lines.length) return null;

  const line = paragraph.lines[lineIdx];
  if (!line || wordIdx >= line.words.length) return null;

  return line.words[wordIdx];
}

// Get previous word
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
// Get next word
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
// Calculate delay between words based on WPM
function getWordDelay(word = null) {
  const baseDelay = (60 / wordsPerMinute) * 1000; // Convert to milliseconds
  
  // If this word ends a sentence, multiply delay by 5
  if (word && isSentenceEnder(word)) {
    return baseDelay * 5;
  }
  
  return baseDelay;
}
// Get current word from OCR data
function getCurrentWord() {
  if (!ocrData || !ocrData.paragraphs.length) return null;

  const paragraph = ocrData.paragraphs[currentParagraphIndex];
  if (!paragraph || !paragraph.lines.length) return null;

  const line = paragraph.lines[currentLineIndex];
  if (!line || !line.words.length) return null;

  return line.words[currentWordIndex];
}
// Advance to next word
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

// Start reading words
// Start reading words
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
  const playPauseIcon = document.getElementById('play-pause-icon');
  if (playPauseIcon) {
    playPauseIcon.src = 'assets/pause_btn.png';
    playPauseIcon.alt = 'pause';
  }

  // Display current word with context immediately
  const currentWord = getCurrentWord();
  const prevWord = getPreviousWord();
  const nextWord = getNextWord();

  if (currentWord) {
    displayWord(currentWord, prevWord, nextWord);
  }

  // Function to schedule next word with appropriate delay
  function scheduleNextWord() {
    const currentWord = getCurrentWord();
    const delay = getWordDelay(currentWord);
    
    readingInterval = setTimeout(() => {
      const hasNext = advanceWord();
      if (hasNext) {
        const currentWord = getCurrentWord();
        const prevWord = getPreviousWord();
        const nextWord = getNextWord();

        if (currentWord) {
          displayWord(currentWord, prevWord, nextWord);
        }
        
        // Schedule the next word
        scheduleNextWord();
      }
    }, delay);
  }

  // Start the scheduling
  scheduleNextWord();
}

// Stop reading words
// Stop reading words
function stopReading() {
  if (!isPlaying) return;

  isPlaying = false;

  // Update button icon
  const playPauseIcon = document.getElementById('play-pause-icon');
  if (playPauseIcon) {
    playPauseIcon.src = 'assets/play_btn.png';
    playPauseIcon.alt = 'play';
  }

  if (readingInterval) {
    clearTimeout(readingInterval); // Changed from clearInterval
    readingInterval = null;
  }
}
// Restart reading with new WPM
// Restart reading with new WPM
function restartReading() {
  if (!isPlaying) return;

  // Clear old timeout
  if (readingInterval) {
    clearTimeout(readingInterval);
    readingInterval = null;
  }

  // Restart the reading loop
  // (The next scheduled word will use the new WPM automatically)
  const currentWord = getCurrentWord();
  const delay = getWordDelay(currentWord);
  
  readingInterval = setTimeout(() => {
    const hasNext = advanceWord();
    if (hasNext) {
      const currentWord = getCurrentWord();
      const prevWord = getPreviousWord();
      const nextWord = getNextWord();

      if (currentWord) {
        displayWord(currentWord, prevWord, nextWord);
      }
      
      // Continue scheduling
      function scheduleNextWord() {
        const currentWord = getCurrentWord();
        const delay = getWordDelay(currentWord);
        
        readingInterval = setTimeout(() => {
          const hasNext = advanceWord();
          if (hasNext) {
            const currentWord = getCurrentWord();
            const prevWord = getPreviousWord();
            const nextWord = getNextWord();

            if (currentWord) {
              displayWord(currentWord, prevWord, nextWord);
            }
            scheduleNextWord();
          }
        }, delay);
      }
      
      scheduleNextWord();
    }
  }, delay);
}
// Reset reading position to beginning
function resetReading() {
  currentParagraphIndex = 0;
  currentLineIndex = 0;
  currentWordIndex = 0;
}

// Move to next line or paragraph
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
// Move to prev line or paragraph
function prevLine() {
  stopReading();

  if (!ocrData || !ocrData.paragraphs.length) return;

  // Check if we've reached end of all paragraphs
  if (currentParagraphIndex == 0) {
    updateDisplayStatus('No more paragraphs. Before this', 'success');
    currentParagraphIndex = ocrData.paragraphs.length - 1; // Stay at last paragraph
    return;
  }

  // Move to next paragraph
  currentParagraphIndex--;
  currentLineIndex = 0;
  currentWordIndex = 0;

  // Display first word of next paragraph with context
  const currentWord = getCurrentWord();
  const prevWord = getPreviousWord();
  const nextWord = getNextWord();

  if (currentWord) {
    displayWord(currentWord, prevWord, nextWord);
  }
}

// Go back 2 lines (replay)
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

// Listen for selection stored event from main process
window.electronAPI.onSelectionStored((coordinates) => {
  isSelected = true;
  selectionCoordinates = coordinates;
  // selectButton.textContent = 'clear';

  // Update status to show OCR is starting
  updateDisplayStatus('Processing text...', 'processing');

  console.log('Selection stored:', coordinates);
});

// Listen for selection cleared event from main process
window.electronAPI.onSelectionCleared(() => {
  isSelected = false;
  selectionCoordinates = null;
  // selectButton.textContent = 'select';

  // Disable refresh and replay buttons when no selection
  // replayButton.disabled = true;

  // Reset OCR data and reading state
  ocrData = null;
  stopReading();
  resetReading();
  updateDisplayStatus('ready to start', 'normal');

  console.log('Selection cleared');
});

// Listen for OCR processing event
window.electronAPI.onOCRProcessing(() => {
  updateDisplayStatus('Scanning text... 0%', 'processing');
  console.log('OCR processing started');
});

// Listen for OCR progress updates
window.electronAPI.onOCRProgress((progress) => {
  updateDisplayStatus(`Scanning text... ${progress}%`, 'processing');
  console.log(`OCR progress: ${progress}%`);
});

// Listen for OCR complete event
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
  // replayButton.disabled = false;
});

// Listen for OCR error event
window.electronAPI.onOCRError((error) => {
  console.error('OCR error:', error);
  updateDisplayStatus(`Error: ${error}`, 'error');
  ocrData = null;
});

// Initialize controls
initializeControls();
