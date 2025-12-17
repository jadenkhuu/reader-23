// Get canvas and context
const canvas = document.getElementById('border-canvas');
const ctx = canvas.getContext('2d');

const highlight = document.getElementById('highlight-canvas');
const hctx = highlight.getContext('2d');

// Function to update dimensions for BOTH canvases
function updateCanvasDimensions() {
  const width = window.innerWidth;
  const height = window.innerHeight;

  // Resize border canvas
  canvas.width = width;
  canvas.height = height;

  // Resize highlight canvas (This was missing)
  highlight.width = width;
  highlight.height = height;
}

// Initial set up
updateCanvasDimensions();

// Draw green border
function drawBorder() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw solid green border around the entire canvas
  ctx.strokeStyle = '#28a745'; // Primary green color
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
}

// Draw on load
drawBorder();

function drawHighlight() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Redraw on window resize
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  drawBorder();
});

function clearHighlight() {
  hctx.clearRect(0, 0, highlight.width, highlight.height);
}

// Draw highlight
window.electronAPI.onUpdateHighlight((rect) => {
  clearHighlight();

  if (rect) {
    hctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
    hctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  }
});

