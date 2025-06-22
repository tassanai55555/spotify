const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { authenticate } = require('../spotify');
const { setAlarm } = require('../alarm');

function createWindow() {

  const win = new BrowserWindow({
    width: 600,
    height: 500,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(() => {
  authenticate();
  createWindow();
});

ipcMain.handle('set-alarm', (event, { time, uri }) => {
  setAlarm(time, uri);
  return `\u2705 Alarm set for ${time}`;
});
