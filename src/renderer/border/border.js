// Get canvas and context
const canvas = document.getElementById('border-canvas');
const ctx = canvas.getContext('2d');

// Set canvas size to window size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Draw green border
function drawBorder() {
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw solid green border around the entire canvas
  ctx.strokeStyle = '#28a745'; // Primary green color (matching the select button)
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
}

// Draw on load
drawBorder();

// Redraw on window resize (in case of DPI changes or similar)
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  drawBorder();
});