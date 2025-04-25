const { app, BrowserWindow, ipcMain, screen, globalShortcut } = require('electron');
const path = require('path');

let mainWindow;
let ytmWindow;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width } = primaryDisplay.workAreaSize;

  mainWindow = new BrowserWindow({
    width: 400,
    height: 100,
    x: width - 410, // 10px from right edge
    y: 10,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    hasShadow: true,
    roundedCorners: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Hacer que la ventana aparezca en todos los espacios de trabajo
  if (process.platform === 'darwin') {
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  }
  
  mainWindow.loadFile('renderer/index.html');
}

function createYTMWindow() {
  ytmWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'ytm_preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true
    }
  });
  
  ytmWindow.loadFile('renderer/ytm.html');
  
  // Abrir herramientas de desarrollo para depuración
  // ytmWindow.webContents.openDevTools({ mode: 'detach' });
  
  ytmWindow.on('closed', () => {
    ytmWindow = null;
    // Si se cierra la ventana de YouTube Music, cerrar toda la aplicación
    app.quit();
  });
}

// Registrar atajos de teclado globales
function registerShortcuts() {
  // Atajo para mostrar/ocultar el overlay (Ctrl+Shift+Y en todos los sistemas)
  // En main.js ya tienes esto:
  const toggleOverlayShortcut = process.platform === 'darwin' ? 'CommandOrControl+Shift+Y' : 'Ctrl+Shift+Y';
  
  // Registrar el atajo global
  globalShortcut.register(toggleOverlayShortcut, () => {
    console.log('Atajo de teclado activado: Toggle Overlay');
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    }
  });
  
  // También podemos añadir atajos para controlar la reproducción
  globalShortcut.register('MediaPlayPause', () => {
    if (ytmWindow) {
      ytmWindow.webContents.send('ytm-command', 'play-pause');
    }
  });
  
  globalShortcut.register('MediaNextTrack', () => {
    if (ytmWindow) {
      ytmWindow.webContents.send('ytm-command', 'next');
    }
  });
  
  globalShortcut.register('MediaPreviousTrack', () => {
    if (ytmWindow) {
      ytmWindow.webContents.send('ytm-command', 'previous');
    }
  });
}

app.whenReady().then(() => {
  createWindow();
  createYTMWindow(); // Crear la ventana de YouTube Music
  registerShortcuts(); // Registrar atajos de teclado
  
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      createYTMWindow();
      registerShortcuts();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Limpiar los atajos de teclado al salir de la aplicación
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// Ocultar overlay (no cierra la app)
ipcMain.on('hide-overlay', () => {
  if (mainWindow) {
    mainWindow.hide();
  }
});

// Mostrar overlay
ipcMain.on('show-overlay', () => {
  if (mainWindow) {
    mainWindow.show();
  }
});

// Alternar visibilidad del overlay
ipcMain.on('toggle-overlay', () => {
  if (mainWindow) {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
    }
  }
});

// Manejar la comunicación entre la ventana YTM y el mini player
ipcMain.on('ytm-track-info', (event, trackInfo) => {
  if (mainWindow) {
    mainWindow.webContents.send('track-info-updated', trackInfo);
  }
});

// Manejar comandos del reproductor
ipcMain.handle('ytmd-play-pause', async () => {
  if (ytmWindow) {
    ytmWindow.webContents.send('ytm-command', 'play-pause');
    return true;
  }
  return false;
});

ipcMain.handle('ytmd-next', async () => {
  if (ytmWindow) {
    ytmWindow.webContents.send('ytm-command', 'next');
    return true;
  }
  return false;
});

ipcMain.handle('ytmd-previous', async () => {
  if (ytmWindow) {
    ytmWindow.webContents.send('ytm-command', 'previous');
    return true;
  }
  return false;
});