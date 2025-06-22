const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  setAlarm: (time, uri) => ipcRenderer.invoke('set-alarm', { time, uri })
});
