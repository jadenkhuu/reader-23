// Get display elements
const displayText = document.getElementById('display-text');

// Update display text with status message
function updateDisplayStatus(message, type = 'normal') {
  displayText.textContent = message;
  displayText.className = type; // Can be: normal, processing, error, success
}

// Display a word in the main display area with context
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
