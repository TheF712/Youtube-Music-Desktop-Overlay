const { ipcRenderer } = require('electron');

// Función para extraer información de la pista actual
function extractTrackInfo() {
  const playerBar = document.querySelector('ytmusic-player-bar');
  if (!playerBar || !playerBar.querySelector('.title')) {
    // No hay reproducción activa
    return {
      track: null,
      player: {
        isPaused: true,
        stateSeconds: 0,
        statePercent: 0
      }
    };
  }
  
  const title = playerBar.querySelector('.title').textContent;
  const author = playerBar.querySelector('.subtitle')?.textContent || '';
  
  // Obtener tiempo actual y duración
  const timeInfo = playerBar.querySelector('#left-controls .time-info');
  let currentTime = 0;
  let duration = 0;
  let statePercent = 0;
  
  if (timeInfo) {
    const timeText = timeInfo.textContent; // Formato: "0:42 / 3:50"
    const timeParts = timeText.split(' / ');
    
    if (timeParts.length === 2) {
      currentTime = convertTimeToSeconds(timeParts[0]);
      duration = convertTimeToSeconds(timeParts[1]);
      statePercent = duration > 0 ? currentTime / duration : 0;
    }
  }
  
  // Verificar si está pausado - Método mejorado y simplificado
  let isPaused = true; // Por defecto asumimos pausado
  
  // Método 1: Verificar el video player directamente (más fiable)
  const videoPlayer = document.querySelector('video');
  if (videoPlayer) {
    isPaused = videoPlayer.paused;
    console.log('Estado según video.paused:', isPaused);
  }
  
  // Método 2: Por el botón de play/pause (respaldo)
  if (videoPlayer === null) {
    const playPauseButton = playerBar.querySelector('#play-pause-button');
    if (playPauseButton) {
      const buttonTitle = playPauseButton.getAttribute('title') || '';
      const ariaLabel = playPauseButton.getAttribute('aria-label') || '';
      
      if (buttonTitle.includes('Pause') || ariaLabel.includes('Pause')) {
        isPaused = false;
      } else if (buttonTitle.includes('Play') || ariaLabel.includes('Play')) {
        isPaused = true;
      }
    }
  }
  
  // Método 3: Por las clases del botón (último recurso)
  if (videoPlayer === null) {
    const playPauseButton = playerBar.querySelector('#play-pause-button');
    if (playPauseButton) {
      // Verificamos si el botón tiene la clase "playing" o alguna variante
      const buttonClasses = playPauseButton.className || '';
      if (buttonClasses.includes('playing')) {
        isPaused = false;
      } else if (buttonClasses.includes('paused')) {
        isPaused = true;
      }
    }
  }
  
  // Obtener la URL de la imagen de la canción
  let imageUrl = '';
  const coverImage = playerBar.querySelector('img.ytmusic-player-bar');
  if (coverImage) {
    imageUrl = coverImage.src || '';
  }
  
  console.log('Estado de reproducción detectado:', isPaused ? 'PAUSADO' : 'REPRODUCIENDO');
  
  return {
    track: {
      title: title,
      author: author,
      duration: duration,
      imageUrl: imageUrl
    },
    player: {
      stateSeconds: currentTime,
      statePercent: statePercent,
      isPaused: isPaused
    }
  };
}

// Convertir tiempo en formato MM:SS a segundos
function convertTimeToSeconds(timeString) {
  const parts = timeString.trim().split(':');
  
  if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  } else if (parts.length === 3) {
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
  }
  
  return 0;
}

// Intervalo de actualización más frecuente para mejor respuesta
setInterval(() => {
  const trackInfo = extractTrackInfo();
  ipcRenderer.sendToHost('ytm-track-info', trackInfo);
}, 500); // Actualizamos cada 500ms para mayor precisión

// Función auxiliar para simular un clic solo si el elemento existe
function clickIfExists(selector) {
  const element = document.querySelector(selector);
  if (element) {
    console.log(`Clicking element: ${selector}`);
    element.click();
    return true;
  }
  return false;
}

// Escuchar comandos desde el host
ipcRenderer.on('ytm-execute-command', (event, command) => {
  console.log('Executing YTM command:', command);
  
  // Intentar ejecutar los comandos con un enfoque más robusto
  switch(command) {
    case 'play-pause':
      // Intentar diferentes métodos para maximizar compatibilidad
      if (!clickIfExists('#play-pause-button')) {
        // Intentar alternativas
        clickIfExists('.play-pause-button') || 
        clickIfExists('.ytmusic-player-bar .toggle-player-button');
        
        // Como último recurso, intentar el atajo de teclado
        const videoElement = document.querySelector('video');
        if (videoElement) {
          if (videoElement.paused) {
            videoElement.play();
          } else {
            videoElement.pause();
          }
        }
      }
      break;
      
    case 'next':
      clickIfExists('.next-button') || 
      clickIfExists('.ytmusic-player-bar .next-button');
      break;
      
    case 'previous':
      clickIfExists('.previous-button') || 
      clickIfExists('.ytmusic-player-bar .previous-button');
      break;
  }
  
  // Enviar inmediatamente una actualización después de ejecutar un comando
  setTimeout(() => {
    const trackInfo = extractTrackInfo();
    ipcRenderer.sendToHost('ytm-track-info', trackInfo);
  }, 100);
});