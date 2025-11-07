const { BrowserWindow, screen } = require('electron');
const path = require('node:path');
const { WINDOW_CONFIG } = require('../../shared/constants');

let borderWindow = null;

// Create border window to show the selection
function createBorderWindow(coordinates, mainWindow) {
  // Close existing border window if any
  if (borderWindow) {
    borderWindow.close();
  }

  // Get the display where the overlay was shown
  const mainWindowBounds = mainWindow.getBounds();
  const currentDisplay = screen.getDisplayMatching(mainWindowBounds);

  // Adjust coordinates to be absolute (add display offset)
  const absoluteX = currentDisplay.bounds.x + coordinates.x;
  const absoluteY = currentDisplay.bounds.y + coordinates.y;

  borderWindow = new BrowserWindow({
    x: absoluteX,
    y: absoluteY,
    width: coordinates.width,
    height: coordinates.height,
    frame: WINDOW_CONFIG.BORDER.FRAME,
    transparent: WINDOW_CONFIG.BORDER.TRANSPARENT,
    alwaysOnTop: WINDOW_CONFIG.BORDER.ALWAYS_ON_TOP,
    skipTaskbar: WINDOW_CONFIG.BORDER.SKIP_TASKBAR,
    resizable: WINDOW_CONFIG.BORDER.RESIZABLE,
    focusable: WINDOW_CONFIG.BORDER.FOCUSABLE,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Make the window click-through
  borderWindow.setIgnoreMouseEvents(true);

  borderWindow.loadFile(path.join(__dirname, '../../renderer/border/border.html'));

  // Handle border window close
  borderWindow.on('closed', () => {
    borderWindow = null;
  });

  return borderWindow;
}

function getBorderWindow() {
  return borderWindow;
}

function closeBorderWindow() {
  if (borderWindow) {
    borderWindow.close();
  }
}

module.exports = {
  createBorderWindow,
  getBorderWindow,
  closeBorderWindow
};
