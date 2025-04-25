const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ytmdOverlay', {
  hideOverlay: () => ipcRenderer.send('hide-overlay'),
  
  // Recibir actualizaciones de información
  updateTrackInfo: (callback) => ipcRenderer.on('track-info-updated', (event, data) => callback(event, data)),
  
  // Comandos del reproductor
  'ytmd-play-pause': () => ipcRenderer.invoke('ytmd-play-pause'),
  'ytmd-next': () => ipcRenderer.invoke('ytmd-next'),
  'ytmd-previous': () => ipcRenderer.invoke('ytmd-previous')
});