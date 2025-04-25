const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ytmBridge', {
  sendTrackInfo: (info) => ipcRenderer.send('ytm-track-info', info),
  onCommand: (callback) => ipcRenderer.on('ytm-command', (event, command) => callback(command)),
  toggleOverlay: () => ipcRenderer.send('toggle-overlay')
});