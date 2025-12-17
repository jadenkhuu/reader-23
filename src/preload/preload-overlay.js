const { contextBridge, ipcRenderer } = require('electron');

// Expose methods for the overlay window
contextBridge.exposeInMainWorld('electronAPI', {
  // Send selection complete with coordinates
  selectionComplete: (coordinates) => ipcRenderer.send('selection-complete', coordinates),

  // Send selection cancelled
  selectionCancelled: () => ipcRenderer.send('selection-cancelled'),  
});