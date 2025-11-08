const { ipcMain } = require('electron');
const { IPC_CHANNELS } = require('../shared/constants');
const { createOverlayWindow, closeOverlayWindow } = require('./windows/OverlayWindow');
const { createBorderWindow, closeBorderWindow } = require('./windows/BorderWindow');
const { getMainWindow } = require('./windows/MainWindow');
const { captureSelectedArea } = require('./ocr/capture');
const { processOCR, resetOcrData } = require('./ocr/processor');

// Store selection state
let selectionState = {
  isSelected: false,
  coordinates: null
};

function registerIPCHandlers() {
  // Handle start selection request
  ipcMain.on(IPC_CHANNELS.START_SELECTION, () => {
    console.log('Start selection requested');
    const mainWindow = getMainWindow();
    createOverlayWindow(mainWindow);
  });

  // Handle selection complete
  ipcMain.on(IPC_CHANNELS.SELECTION_COMPLETE, async (event, coordinates) => {
    console.log('Selection complete:', coordinates);

    const mainWindow = getMainWindow();

    // Store coordinates
    selectionState.isSelected = true;
    selectionState.coordinates = coordinates;

    // Close overlay window
    closeOverlayWindow();

    // Create border window to show the selection
    createBorderWindow(coordinates, mainWindow);

    // Ensure border window stays on top
    mainWindow.setAlwaysOnTop(true, 'floating');

    // Notify main window that selection is stored
    mainWindow.webContents.send(IPC_CHANNELS.SELECTION_STORED, coordinates);

    // Start OCR processing automatically
    try {
      const screenshot = await captureSelectedArea(coordinates, mainWindow);
      const ocrResult = await processOCR(screenshot, coordinates, mainWindow);

      // Send OCR result to renderer
      mainWindow.webContents.send(IPC_CHANNELS.OCR_COMPLETE, ocrResult);
      console.log('OCR result sent to renderer');
    } catch (error) {
      console.error('Error in OCR pipeline:', error);
      mainWindow.webContents.send(IPC_CHANNELS.OCR_ERROR, error.message);
    }
  });

  // Handle selection cancelled
  ipcMain.on(IPC_CHANNELS.SELECTION_CANCELLED, () => {
    console.log('Selection cancelled');

    // Close overlay window
    closeOverlayWindow();
  });

  // Handle clear selection request
  ipcMain.on(IPC_CHANNELS.CLEAR_SELECTION, () => {
    console.log('Clear selection requested');

    const mainWindow = getMainWindow();

    // Clear stored coordinates
    selectionState.isSelected = false;
    selectionState.coordinates = null;

    // Clear OCR data
    resetOcrData();

    // Close border window
    closeBorderWindow();

    mainWindow.setAlwaysOnTop(true);

    // Notify main window
    mainWindow.webContents.send(IPC_CHANNELS.SELECTION_CLEARED);
  });

  // Handle refresh OCR request
  ipcMain.on(IPC_CHANNELS.REFRESH_OCR, async () => {
    console.log('Refresh OCR requested');

    const mainWindow = getMainWindow();

    // Check if we have a selection
    if (!selectionState.isSelected || !selectionState.coordinates) {
      console.error('No selection to refresh');
      mainWindow.webContents.send(IPC_CHANNELS.OCR_ERROR, 'No selection to refresh');
      return;
    }

    // Re-run OCR with existing coordinates
    try {
      const screenshot = await captureSelectedArea(selectionState.coordinates, mainWindow);
      const ocrResult = await processOCR(screenshot, selectionState.coordinates, mainWindow);

      // Send OCR result to renderer
      mainWindow.webContents.send(IPC_CHANNELS.OCR_COMPLETE, ocrResult);
      console.log('OCR refresh complete');
    } catch (error) {
      console.error('Error in OCR refresh:', error);
      mainWindow.webContents.send(IPC_CHANNELS.OCR_ERROR, error.message);
    }
  });
  // minimize window
  ipcMain.on('window-minimize', () => {
    console.log('[Main] Minimize window requested');
    const mainWindow = getMainWindow();
    if (mainWindow) {
      mainWindow.minimize();
      console.log('[Main] Window minimized');
    } else {
      console.error('[Main] Main window not found');
    }
  });
  // Close window
  ipcMain.on('window-close', () => {
    console.log('[Main] Close window requested');
    const mainWindow = getMainWindow();
    if (mainWindow) {
      mainWindow.close();
      console.log('[Main] Window closed');
    } else {
      console.error('[Main] Main window not found');
    }
  });
}



module.exports = {
  registerIPCHandlers
};
