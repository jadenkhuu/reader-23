const { BrowserWindow } = require('electron');
const path = require('node:path');
const { WINDOW_CONFIG } = require('../../shared/constants');

let mainWindow;

function createMainWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: WINDOW_CONFIG.MAIN.WIDTH,
    height: WINDOW_CONFIG.MAIN.HEIGHT,
    resizable: WINDOW_CONFIG.MAIN.RESIZABLE,
    maximizable: WINDOW_CONFIG.MAIN.MAXIMIZABLE,
    fullscreenable: WINDOW_CONFIG.MAIN.FULLSCREENABLE,
    alwaysOnTop: WINDOW_CONFIG.MAIN.ALWAYS_ON_TOP,
    frame: false, // Removes window border buttons etc window frame
    transparent: true, // Makes window background transparent
    webPreferences: {
      preload: path.join(__dirname, '../../preload/preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, '../../renderer/main/index.html'));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools({mode: 'detach'});

  return mainWindow;
}

function getMainWindow() {
  return mainWindow;
}

module.exports = {
  createMainWindow,
  getMainWindow
};
