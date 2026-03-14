// --- Player State & API ---
let embedController = null;
let isSpotifyPlaying = false;
let spotifyApi = null; // Variable to hold the loaded API

// Local Background Music State
let bgmAudio = null;
let isLocalPlaying = false;

window.onSpotifyIframeApiReady = (IFrameAPI) => {
  spotifyApi = IFrameAPI;
};

/**
 * Starts the local background music. Called on successful login.
 */
function startBackgroundMusic() {
  if (!bgmAudio) {
    bgmAudio = new Audio("assets/sounds/backgroundMusic.mp3");
    bgmAudio.loop = true;
    bgmAudio.volume = 0.5;
  }
  
  bgmAudio.play().then(() => {
    isLocalPlaying = true;
    updateBgmButton();
    startDockNoteLoop(); // Start notes on the dock icon immediately
    
    // Ensure the icon shows active
    if (typeof setAppIconActive === "function") {
      setAppIconActive("music", true);
    }
    
    // Make sure the window is internally registered as "open but minimized"
    const musicWinId = "music";
    if (window.windowStates) {
      window.windowStates[musicWinId] = "minimized";
    }
  }).catch(e => {
    console.error("Auto-play prevented for background music:", e);
    isLocalPlaying = false;
    updateBgmButton();
  });
}

function toggleBackgroundMusic() {
  if (!bgmAudio) return;
  if (isLocalPlaying) {
    bgmAudio.pause();
    isLocalPlaying = false;
  } else {
    bgmAudio.play();
    isLocalPlaying = true;
  }
  updateBgmButton();
  
  if (isLocalPlaying || isSpotifyPlaying) {
    startWindowNoteLoop();
  } else {
    stopWindowNoteLoop();
  }
}

function updateBgmButton() {
  const btn = document.getElementById("bgm-play-btn");
  if (btn) {
    btn.textContent = isLocalPlaying ? "Pause" : "Play";
  }
}

function switchToSpotify() {
  document.getElementById("local-music-view").style.display = "none";
  document.getElementById("spotify-view").style.display = "block";
  document.getElementById("music-back-btn").style.display = "inline";
  
  // Pause local music when switching to Spotify to avoid overlap
  if (isLocalPlaying && bgmAudio) {
    bgmAudio.pause();
    isLocalPlaying = false;
    updateBgmButton();
    
    // Stop the floating notes if Spotify isn't playing yet
    if (!isSpotifyPlaying) {
      stopWindowNoteLoop();
    }
  }

  createMusicPlayer();
}

function switchToLocalMusic() {
  document.getElementById("spotify-view").style.display = "none";
  document.getElementById("local-music-view").style.display = "flex";
  document.getElementById("music-back-btn").style.display = "none";
}

function createMusicPlayer() {
  if (embedController || !spotifyApi) {
    return;
  }

  let element = document.getElementById("spotify-embed");
  if (!element) {
    const parentContainer = document.getElementById("spotify-view");
    if (parentContainer) {
      element = document.createElement("div");
      element.id = "spotify-embed";
      element.style.height = "100%";
      parentContainer.appendChild(element);
    } else {
      return;
    }
  }

  const options = {
    uri: "spotify:playlist:6TJxITfc7J0PKxMy44OtKB",
    width: "100%",
    height: "100%",
    theme: "dark",
  };

  const callback = (controller) => {
    embedController = controller;
    embedController.addListener("playback_update", (e) => {
      isSpotifyPlaying = !e.data.isPaused;
      const musicWindow = document.getElementById("music");
      if (!musicWindow) return;

      const isWindowVisible = musicWindow.style.display !== "none";

      if ((isSpotifyPlaying || isLocalPlaying) && isWindowVisible) {
        startWindowNoteLoop();
      } else {
        stopWindowNoteLoop();
      }
    });
  };

  spotifyApi.createController(element, options, callback);
}

function isMusicPlaying() {
  return isSpotifyPlaying || isLocalPlaying;
}

function destroyMusicPlayer() {
  if (embedController) {
    embedController.destroy();
    embedController = null;
  }
  isSpotifyPlaying = false;
  
  if (bgmAudio) {
    bgmAudio.pause();
    bgmAudio.currentTime = 0;
  }
  isLocalPlaying = false;
  
  stopWindowNoteLoop();
  stopDockNoteLoop();
  if (typeof setAppIconActive === "function") {
    setAppIconActive("music", false);
  }
}

// --- Animation Logic ---
let dockNoteAnimationInterval = null;
let windowNoteAnimationInterval = null;

function createNoteElement(config) {
  const notes = ["♪", "♫", "♬", "♩", "♭", "♮"];
  const noteEl = document.createElement("div");
  noteEl.classList.add("musical-note");
  noteEl.textContent = notes[Math.floor(Math.random() * notes.length)];
  noteEl.style.zIndex = config.zIndex;
  document.body.appendChild(noteEl);
  const duration = Math.random() * 1 + 1.5;
  const finalScale = Math.random() * 0.4 + 0.3;
  const horizontalDrift = (Math.random() - 0.5) * 80;
  noteEl.style.animationDuration = `${duration}s`;
  noteEl.style.setProperty("--random-x", `${horizontalDrift}px`);
  noteEl.style.setProperty("--random-scale", finalScale);
  noteEl.style.left = `${config.x}px`;
  noteEl.style.top = `${config.y}px`;
  setTimeout(() => noteEl.remove(), duration * 1000);
}

function createDockNote() {
  const allIcons = document.querySelectorAll('.dock-icon[data-app="music"]');
  const el = Array.from(allIcons).find((icon) => icon.offsetParent !== null);
  if (!el) return;
  const rect = el.getBoundingClientRect();
  createNoteElement({
    x: rect.left + rect.width / 2,
    y: rect.top,
    zIndex: 4999,
  });
}

function createWindowNote() {
  const el = document.getElementById("music");
  if (!el || el.style.display === "none") return;
  const rect = el.getBoundingClientRect();
  createNoteElement({
    x: rect.left + Math.random() * rect.width,
    y: rect.top,
    zIndex: parseInt(el.style.zIndex || 100) - 1,
  });
}

function startDockNoteLoop() {
  if (dockNoteAnimationInterval) return;
  dockNoteAnimationInterval = setInterval(createDockNote, 400);
}

function stopDockNoteLoop() {
  clearInterval(dockNoteAnimationInterval);
  dockNoteAnimationInterval = null;
}

function startWindowNoteLoop() {
  if (windowNoteAnimationInterval) return;
  windowNoteAnimationInterval = setInterval(createWindowNote, 200);
}

function stopWindowNoteLoop() {
  clearInterval(windowNoteAnimationInterval);
  windowNoteAnimationInterval = null;
}
