// Selection state
let isDrawing = false;
let startX = 0;
let startY = 0;
let currentX = 0;
let currentY = 0;

// Get canvas and context
const canvas = document.getElementById('selection-canvas');
const ctx = canvas.getContext('2d');

// Set canvas size to window size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Handle window resize
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

// Mouse down - start selection
canvas.addEventListener('mousedown', (e) => {
  isDrawing = true;
  startX = e.clientX;
  startY = e.clientY;
  currentX = e.clientX;
  currentY = e.clientY;
});

// Mouse move - update selection rectangle
canvas.addEventListener('mousemove', (e) => {
  if (!isDrawing) return;

  currentX = e.clientX;
  currentY = e.clientY;

  // Redraw
  drawSelection();
});

// Mouse up - finalize selection
canvas.addEventListener('mouseup', (e) => {
  if (!isDrawing) return;

  isDrawing = false;
  currentX = e.clientX;
  currentY = e.clientY;

  // Calculate final coordinates
  const coordinates = calculateCoordinates();

  // Validate selection (minimum 10x10 pixels)
  if (coordinates.width < 10 || coordinates.height < 10) {
    console.log('Selection too small, cancelled');
    window.electronAPI.selectionCancelled();
    return;
  }

  // Send coordinates to main process
  window.electronAPI.selectionComplete(coordinates);
});

// ESC key to cancel
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    window.electronAPI.selectionCancelled();
  }
});

// Draw selection rectangle
function drawSelection() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Calculate rectangle dimensions
  const x = Math.min(startX, currentX);
  const y = Math.min(startY, currentY);
  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);

  // Draw semi-transparent background for selected area
  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.fillRect(x, y, width, height);

  // Draw border
  ctx.strokeStyle = '#00aaff';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  ctx.strokeRect(x, y, width, height);

  // Draw dimension label
  if (width > 50 && height > 30) {
    const label = `${Math.round(width)} × ${Math.round(height)}`;
    ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#00aaff';
    ctx.fillText(label, x + 5, y + 20);
  }
}

// Calculate final coordinates
function calculateCoordinates() {
  const x = Math.min(startX, currentX);
  const y = Math.min(startY, currentY);
  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);

  return { x, y, width, height };
}