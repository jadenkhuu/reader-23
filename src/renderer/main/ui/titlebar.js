/**
 * Titlebar Controls Handler
 * Handles minimize, maximize, and close button clicks
 */

function initializeTitlebar() {
  // Get button references
  const pinBtn = document.getElementById('pin-btn');
  const minimizeBtn = document.getElementById('minimize-btn');
  const maximizeBtn = document.getElementById('maximize-btn');
  const closeBtn = document.getElementById('close-btn');

  // Toggle pinned window
  if (pinBtn) {
    pinBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent event bubbling
      console.log('Pin button clicked');
      window.electronAPI.togglePinned();
    });
  }

  // Minimize button
  if (minimizeBtn) {
    minimizeBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent event bubbling
      console.log('Minimize button clicked');
      window.electronAPI.minimizeWindow();
    });
  }

  // Close button
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      console.log('Close button clicked');
      window.electronAPI.closeWindow();
    });
  }

  console.log('Titlebar controls initialized');
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeTitlebar);
} else {
  initializeTitlebar();
}