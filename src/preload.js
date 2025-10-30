// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Send events to main process
  startSelection: () => ipcRenderer.send('start-selection'),
  clearSelection: () => ipcRenderer.send('clear-selection'),
  refreshOCR: () => ipcRenderer.send('refresh-ocr'), // NEW: Refresh OCR with existing selection

  // Receive events from main process
  onSelectionStored: (callback) => {
    ipcRenderer.on('selection-stored', (event, coordinates) => callback(coordinates));
  },
  onSelectionCleared: (callback) => {
    ipcRenderer.on('selection-cleared', () => callback());
  },

  // NEW: OCR event listeners
  onOCRProcessing: (callback) => {
    ipcRenderer.on('ocr-processing', () => callback());
  },
  onOCRComplete: (callback) => {
    ipcRenderer.on('ocr-complete', (event, data) => callback(data));
  },
  onOCRError: (callback) => {
    ipcRenderer.on('ocr-error', (event, error) => callback(error));
  },
  onOCRProgress: (callback) => {
    ipcRenderer.on('ocr-progress', (event, progress) => callback(progress));
  }
});