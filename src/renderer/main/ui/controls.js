// Get button references
const selectButton = document.getElementById('select-button');
const replayButton = document.getElementById('replay-button');
const playPauseButton = document.getElementById('play-pause-button');
const nextButton = document.getElementById('next-button');

// Get WPM control references
const wpmSlider = document.getElementById('wpm-slider');
const wpmInput = document.getElementById('wpm-input');

// Initialize controls
function initializeControls() {
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

  // Handle Replay button click
  replayButton.addEventListener('click', () => {
    if (!ocrData) {
      updateDisplayStatus('Please select an area first', 'error');
      return;
    }

    replayLines();
  });

  // Handle Play/Pause button
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

  // Handle Next button
  nextButton.addEventListener('click', () => {
    if (!ocrData) {
      updateDisplayStatus('Please select an area first', 'error');
      return;
    }

    nextLine();
  });

  // Handle WPM slider change
  wpmSlider.addEventListener('input', (e) => {
    wordsPerMinute = parseInt(e.target.value);
    wpmInput.value = wordsPerMinute;

    // If currently playing, restart with new timing
    if (isPlaying) {
      restartReading();
    }
  });

  // Handle WPM input change
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

  // Handle WPM input blur (fix invalid values)
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

  // ESC key handler to clear selection and Space bar to play/pause
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isSelected) {
      window.electronAPI.clearSelection();
    }

    // Space bar to play/pause
    if (e.key === ' ' && ocrData) {
      e.preventDefault();
      if (isPlaying) {
        stopReading();
      } else {
        startReading();
      }
    }
  });
}
