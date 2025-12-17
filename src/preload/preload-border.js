const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onUpdateHighlight: (callback) => {
    ipcRenderer.on('update-highlight', (event, rect) => callback(rect));
  }
});