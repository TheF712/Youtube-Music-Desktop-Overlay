document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM cargado');
  
  // Constante para la imagen predeterminada con ruta absoluta
  const DEFAULT_ALBUM_ART = new URL('../images/no_album.png', window.location.href).href;
  
  // Referencias a elementos de la interfaz
  const titleContainer = document.getElementById('title-container');
  const titleElement = document.getElementById('title');
  const artistContainer = document.getElementById('artist-container');
  const artistElement = document.getElementById('artist');
  const timeElement = document.getElementById('time');
  const progressBar = document.getElementById('progress-bar');
  const playButton = document.getElementById('play');
  const prevButton = document.getElementById('prev');
  const nextButton = document.getElementById('next');
  const coverImage = document.getElementById('cover-image');
  
  // Variable para almacenar el estado actual de reproducción
  let currentPlayState = {
    isPaused: true
  };
  
  // Establecer la imagen predeterminada inmediatamente al cargar
  if (coverImage) {
    coverImage.src = DEFAULT_ALBUM_ART;
    
    // Agregar evento onerror para manejar fallos de carga
    coverImage.onerror = () => {
      console.log('Error al cargar la imagen de portada, usando imagen predeterminada');
      coverImage.src = DEFAULT_ALBUM_ART;
    };
  }
  
  // Definir los emojis de manera clara
  const PLAY_EMOJI = "▶";
  const PAUSE_EMOJI = "⏸";
  
  // Botones de reproducción
  if (playButton) {
    playButton.addEventListener('click', async () => {
      console.log('Botón play/pause clickeado');
      await sendCommand('ytmd-play-pause');
      
      // Actualizar el botón manualmente (para respuesta inmediata)
      // Invertir visualmente el estado actual mientras esperamos la próxima actualización real
      currentPlayState.isPaused = !currentPlayState.isPaused;
      updatePlayButtonState(currentPlayState.isPaused);
    });
  }
  
  if (prevButton) {
    prevButton.addEventListener('click', () => {
      console.log('Botón anterior clickeado');
      sendCommand('ytmd-previous');
    });
  }
  
  if (nextButton) {
    nextButton.addEventListener('click', () => {
      console.log('Botón siguiente clickeado');
      sendCommand('ytmd-next');
    });
  }
  
  // Función para actualizar el estado del botón play/pause
  function updatePlayButtonState(isPaused) {
    if (!playButton) return;
    
    console.log('Actualizando botón play/pause a:', isPaused ? 'PLAY' : 'PAUSE');
    playButton.textContent = isPaused ? PLAY_EMOJI : PAUSE_EMOJI;
  }
  
  // Función para enviar comandos via IPC
  async function sendCommand(command) {
    try {
      return await window.ytmdOverlay[command]();
    } catch (error) {
      console.error(`Error enviando comando ${command}:`, error);
      return false;
    }
  }
  
  // Formatear tiempo (segundos a MM:SS)
  function formatTime(seconds) {
    if (!seconds && seconds !== 0) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  // Función para actualizar el título
  function updateSongTitle(title) {
    if (!titleElement) return;
    titleElement.textContent = title || "Sin reproducción";
  }
  
  // Función para actualizar el artista
  function updateArtist(artist) {
    if (!artistElement) return;
    artistElement.textContent = artist || "";
  }
  
  // Actualizar la interfaz con la información de la pista y el estado del reproductor
  window.ytmdOverlay.updateTrackInfo((event, data) => {
    // Si no hay datos válidos o no hay canción reproduciéndose, mostrar valores por defecto
    if (!data || !data.track) {
      updateSongTitle("Sin reproducción");
      updateArtist("");
      if (progressBar) progressBar.style.width = "0%";
      if (timeElement) timeElement.textContent = "00:00 / 00:00";
      if (playButton) playButton.textContent = PLAY_EMOJI; // Icono de play cuando no hay reproducción
      if (coverImage) coverImage.src = DEFAULT_ALBUM_ART;
      return;
    }
    
    // Actualizar la imagen de portada
    if (coverImage) {
      if (data.track.imageUrl && data.track.imageUrl.trim() !== '') {
        coverImage.src = data.track.imageUrl;
        coverImage.alt = data.track.title || "Album Cover";
      } else {
        coverImage.src = DEFAULT_ALBUM_ART;
        coverImage.alt = "No album art";
      }
    }
    
    // Actualizar el título
    if (data.track.title) {
      updateSongTitle(data.track.title);
    }
    
    // Actualizar el artista
    if (data.track.author) {
      updateArtist(data.track.author);
    }
    
    // Actualizar la barra de progreso
    if (progressBar) {
      const percent = (data.player && data.player.statePercent !== undefined) ? data.player.statePercent * 100 : 0;
      progressBar.style.width = `${percent}%`;
    }
    
    // Actualizar el tiempo
    if (timeElement) {
      const currentTime = formatTime(data.player?.stateSeconds || 0);
      const totalTime = formatTime(data.track?.duration || 0);
      timeElement.textContent = `${currentTime} / ${totalTime}`;
    }
    
    // Actualizar el estado de reproducción y el botón
    if (data.player) {
      // Guardar el estado actual
      currentPlayState.isPaused = !!data.player.isPaused;
      
      // Actualizar el botón de reproducción
      updatePlayButtonState(currentPlayState.isPaused);
    }
  });
});