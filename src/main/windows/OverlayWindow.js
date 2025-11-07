const { BrowserWindow, screen } = require('electron');
const path = require('node:path');
const { WINDOW_CONFIG } = require('../../shared/constants');

let overlayWindow = null;

// Create overlay window for screen selection
function createOverlayWindow(mainWindow) {
  if (overlayWindow) {
    overlayWindow.focus();
    return overlayWindow;
  }

  const mainWindowBounds = mainWindow.getBounds();
  const currentDisplay = screen.getDisplayMatching(mainWindowBounds);

  overlayWindow = new BrowserWindow({
    x: currentDisplay.bounds.x,
    y: currentDisplay.bounds.y,
    width: currentDisplay.bounds.width,
    height: currentDisplay.bounds.height,
    frame: WINDOW_CONFIG.OVERLAY.FRAME,
    transparent: WINDOW_CONFIG.OVERLAY.TRANSPARENT,
    alwaysOnTop: WINDOW_CONFIG.OVERLAY.ALWAYS_ON_TOP,
    skipTaskbar: WINDOW_CONFIG.OVERLAY.SKIP_TASKBAR,
    webPreferences: {
      preload: path.join(__dirname, '../../preload/preload-overlay.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  overlayWindow.loadFile(path.join(__dirname, '../../renderer/overlay/overlay.html'));

  // Handle overlay window close
  overlayWindow.on('closed', () => {
    overlayWindow = null;
  });

  return overlayWindow;
}

function getOverlayWindow() {
  return overlayWindow;
}

function closeOverlayWindow() {
  if (overlayWindow) {
    overlayWindow.close();
  }
}

module.exports = {
  createOverlayWindow,
  getOverlayWindow,
  closeOverlayWindow
};
