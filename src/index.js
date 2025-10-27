const { app, BrowserWindow, ipcMain, screen } = require('electron');

const path = require('node:path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

// Store references to windows
let mainWindow;
let overlayWindow = null;
let borderWindow = null;

// Store selection state
let selectionState = {
  isSelected: false,
  coordinates: null
};

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

// Create overlay window for screen selection
function createOverlayWindow() {
  // Don't create if already exists
  if (overlayWindow) {
    overlayWindow.focus();
    return;
  }

  const mainWindowBounds = mainWindow.getBounds();
  const currentDisplay = screen.getDisplayMatching(mainWindowBounds);

  overlayWindow = new BrowserWindow({
    x: currentDisplay.bounds.x,
    y: currentDisplay.bounds.y,
    width: currentDisplay.bounds.width,
    height: currentDisplay.bounds.height,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload-overlay.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  overlayWindow.loadFile(path.join(__dirname, 'overlay.html'));

  // Handle overlay window close
  overlayWindow.on('closed', () => {
    overlayWindow = null;
  });
}

// Create border window to show the selection
function createBorderWindow(coordinates) {
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
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    focusable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  // Make the window click-through
  borderWindow.setIgnoreMouseEvents(true);

  borderWindow.loadFile(path.join(__dirname, 'border.html'));

  // Handle border window close
  borderWindow.on('closed', () => {
    borderWindow = null;
  });

  // Optional: Open DevTools for debugging border
  // borderWindow.webContents.openDevTools();
}

// IPC Handlers

// Handle start selection request
ipcMain.on('start-selection', () => {
  console.log('Start selection requested');
  createOverlayWindow();
});

// Handle selection complete
ipcMain.on('selection-complete', (event, coordinates) => {
  console.log('Selection complete:', coordinates);

  // Store coordinates
  selectionState.isSelected = true;
  selectionState.coordinates = coordinates;

  // Close overlay window
  if (overlayWindow) {
    overlayWindow.close();
  }

  // Create border window to show the selection
  createBorderWindow(coordinates);

  // Ensure border window stays on top
  mainWindow.setAlwaysOnTop(true, 'floating');

  // Notify main window
  mainWindow.webContents.send('selection-stored', coordinates);
});

// Handle selection cancelled
ipcMain.on('selection-cancelled', () => {
  console.log('Selection cancelled');

  // Close overlay window
  if (overlayWindow) {
    overlayWindow.close();
  }
});

// Handle clear selection request
ipcMain.on('clear-selection', () => {
  console.log('Clear selection requested');

  // Clear stored coordinates
  selectionState.isSelected = false;
  selectionState.coordinates = null;

  // Close border window
  if (borderWindow) {
    borderWindow.close();
  }

  mainWindow.setAlwaysOnTop(true);

  // Notify main window
  mainWindow.webContents.send('selection-cleared');
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.