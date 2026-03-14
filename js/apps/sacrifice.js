/**
 * App: Sacrifice Easter Egg
 * When the dead dog skull is dropped on the Sacrifice icon in Finder Documents,
 * a dramatic ritual animation takes over the entire screen.
 */

// --- PURGE SEQUENCE STATE ---
// 0: installer.dmg, 1: pre-install warning shown, 2: PURGE.exe installed, 3: Warning shown, 4: Evil hint shown
window.purgeState = 0;

window.handlePurgeAction = function () {
  if (window.purgeState === 0) {
    showPreInstallWarning();
  } else if (window.purgeState === 2) {
    showWarningWindow();
  } else if (window.purgeState >= 3) {
    showEvilHintWindow();
  }
};

function showPreInstallWarning() {
  const id = "purge-pre-warning";
  if (document.getElementById(id)) return;

  const win = document.createElement("div");
  win.id = id;
  win.className = "window";
  Object.assign(win.style, {
    display: "flex", flexDirection: "column", width: "400px", height: "180px",
    top: "35%", left: "40%"
  });
  win.innerHTML = `
    <div class="title" style="background: #ffcc00;">
      <span class="title-text" style="color: #000;">System Alert</span>
      <span class="controls"><span class="ctrl ctrl-close" onclick="this.closest('.window').remove()">&#x00D7;</span></span>
    </div>
    <div class="content" style="padding: 20px; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; background: #fffbe6;">
      <p style="font-family: 'VT323', monospace; font-size: 18px; color: #a80; font-weight: bold; margin: 0 0 15px 0;">
        Are you sure you want to run installer.dmg?<br>
        This file is from an unverified developer. You should not install it.
      </p>
      <div style="display: flex; gap: 15px;">
        <button onclick="window.purgeState = 0; this.closest('.window').remove();" style="padding: 6px 16px; font-weight: bold;">Cancel</button>
        <button onclick="this.closest('.window').remove(); showInstallWindow();" style="padding: 6px 16px;">Install Anyway</button>
      </div>
    </div>`;
  document.body.appendChild(win);
  if (typeof makeDraggable === "function") makeDraggable(win);
  if (typeof bringToFront === "function") bringToFront(win);
  window.purgeState = 1;
}

function showInstallWindow() {
  const id = "purge-installer";
  if (document.getElementById(id)) return;

  const win = document.createElement("div");
  win.id = id;
  win.className = "window";
  Object.assign(win.style, {
    display: "flex", flexDirection: "column", width: "400px", height: "260px",
    top: "30%", left: "40%"
  });
  
  // Make sure installer stays strictly on top of the fake warnings
  win.style.zIndex = "9000"; 

  win.innerHTML = `
    <div class="title" style="background: #333;">
      <span class="title-text" style="color: #0f0;">Installer - PURGE</span>
      <span class="controls"><span class="ctrl ctrl-close" style="pointer-events: none; opacity: 0.5;">&#x00D7;</span></span>
    </div>
    <div class="content" style="padding: 15px; display: flex; flex-direction: column; height: 100%; background: #000; color: #0f0;">
      <div id="install-logs" style="font-family: 'VT323', monospace; font-size: 16px; line-height: 1.2; flex-grow: 1; overflow: hidden; white-space: pre-wrap; margin-bottom: 10px; display: flex; flex-direction: column; justify-content: flex-end;"></div>
      <div style="width: 100%; height: 16px; border: 2px solid #555; background: #222; margin-top: auto;">
        <div id="install-bar" style="width: 0%; height: 100%; background: #0f0; transition: width 9.5s cubic-bezier(0.2, 0.8, 0.3, 1);"></div>
      </div>
    </div>`;
  document.body.appendChild(win);
  if (typeof makeDraggable === "function") makeDraggable(win);

  const logsEl = win.querySelector("#install-logs");
  const logMessages = [
    "Extracting payload...",
    "Scanning user directories...",
    "Found /Documents/Album Folder",
    "Found /System_Architecture_Blueprint",
    "Uploading system manifests to remote server...",
    "Bypassing internal security protocols...",
    "WARNING: CPU TEMPERATURE CRITICAL",
    "Injecting rootkit into kernel space...",
    "Modifying system registry...",
    "Disabling firewall...",
    "Opening remote port 666...",
    "Corrupting memory blocks...",
    "Finalizing PURGE protocol.",
    "Installation Complete."
  ];

  let logIndex = 0;
  const targetLogDelay = 9000 / logMessages.length; 
  const logInterval = setInterval(() => {
    if (logIndex < logMessages.length) {
      const p = document.createElement("div");
      p.textContent = logMessages[logIndex];
      logsEl.appendChild(p);
      logIndex++;
    } else {
      clearInterval(logInterval);
    }
  }, targetLogDelay);

  const fakeWindows = [];
  const warningTitles = ["CRITICAL ERROR", "SYSTEM FAILURE", "FIREWALL BREACHED", "CPU OVERLOAD", "UNAUTHORIZED ACCESS", "IP SHARED", "MEMORY CORRUPTION", "FATAL EXCEPTION"];
  const warningColors = ["#f00", "#ff0", "#f90"];
  
  let spawnCount = 0;
  const maxSpawns = 18;
  const spawnInterval = setInterval(() => {
    if (spawnCount >= maxSpawns) {
      clearInterval(spawnInterval);
      return;
    }

    const fakeWin = document.createElement("div");
    fakeWin.className = "window warning-blink";
    const title = warningTitles[Math.floor(Math.random() * warningTitles.length)];
    const color = warningColors[Math.floor(Math.random() * warningColors.length)];
    
    // Random position across the screen, avoiding the direct center where the installer is
    const top = Math.random() * 70 + 5; // 5% to 75%
    const left = Math.random() * 70 + 5; 

    Object.assign(fakeWin.style, {
      display: "flex", flexDirection: "column", width: "300px", height: "140px",
      top: top + "%", left: left + "%", zIndex: (8000 + spawnCount).toString()
    });

    fakeWin.innerHTML = `
      <div class="title" style="background: ${color};">
        <span class="title-text" style="${color === '#ff0' ? 'color: #000;' : 'color: #fff;'}">${title}</span>
      </div>
      <div class="content" style="padding: 15px; text-align: center; display: flex; align-items: center; justify-content: center; height: 100%; background: #000;">
        <p style="font-family: 'VT323', monospace; font-size: 18px; color: ${color}; margin: 0;">${title} DETECTED IN SECTOR ${Math.floor(Math.random()*999)}.</p>
      </div>`;
      
    document.body.appendChild(fakeWin);
    fakeWindows.push(fakeWin);
    
    // Create annoying error sounds
    const glitchObj = new Audio("assets/sounds/Error_1.mp3");
    glitchObj.volume = 0.3;
    glitchObj.play().catch(()=>{});

    spawnCount++;
    
    // Force installer window to stay on top
    win.style.setProperty("z-index", "99999", "important");
  }, 450); // Spawn one roughly every half second

  // Helper to trigger the split-second screen glitch
  const triggerGlitch = () => {
    document.body.classList.add("sacrifice-shake");
    const vignette = document.createElement("div");
    vignette.className = "sacrifice-vignette";
    vignette.style.zIndex = "9999";
    document.body.appendChild(vignette);
    
    const hardGlitch = new Audio("assets/sounds/Error_1.mp3");
    hardGlitch.volume = 0.8;
    hardGlitch.play().catch(()=>{});

    setTimeout(() => {
      document.body.classList.remove("sacrifice-shake");
      vignette.remove();
    }, 400); // 400ms glitch duration
  };

  // Start the install progress bar
  setTimeout(() => {
    const bar = win.querySelector("#install-bar");
    if (bar) bar.style.width = "100%";

    // First big glitch
    setTimeout(triggerGlitch, 3500);
    // Second big glitch
    setTimeout(triggerGlitch, 7000);

    // End of installation: Cleanup
    setTimeout(() => {
      // Delete all the fake warning popups instantly
      fakeWindows.forEach(fw => fw.remove());
      clearInterval(spawnInterval);
      
      const text = win.querySelector("#install-text");
      if (text) text.textContent = "Installation Complete!";
      window.purgeState = 2;
      if (typeof renderFinderContent === "function") renderFinderContent("downloads");
      
      // Close the installer window
      setTimeout(() => win.remove(), 1200);
    }, 9500); // 9.5s slow install
  }, 100);
}

function showWarningWindow() {
  const id = "purge-warning";
  if (document.getElementById(id)) {
    typeof bringToFront === "function" && bringToFront(document.getElementById(id));
    return;
  }
  const win = document.createElement("div");
  win.id = id;
  win.className = "window warning-blink";
  Object.assign(win.style, {
    display: "flex", flexDirection: "column", width: "400px", height: "200px",
    top: "35%", left: "42%"
  });
  win.innerHTML = `
    <div class="title" style="background: #ff3b30;">
      <span class="title-text" style="color: #fff;">SYSTEM WARNING</span>
      <span class="controls"><span class="ctrl ctrl-close" onclick="this.closest('.window').remove()">&#x00D7;</span></span>
    </div>
    <div class="content" style="padding: 20px; text-align: center; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; background: #ffe6e6;">
      <p style="font-family: 'VT323', monospace; font-size: 20px; color: #d00; font-weight: bold; line-height: 1.4; margin: 0;">
        ⚠️ DANGEROUS SOFTWARE DETECTED ⚠️<br><br>
        This program poses a severe threat to your system.<br>
        DELETE IT ASAP.
      </p>
    </div>`;
  document.body.appendChild(win);
  if (typeof makeDraggable === "function") makeDraggable(win);
  if (typeof bringToFront === "function") bringToFront(win);
  window.purgeState = 3;
}

function showEvilHintWindow() {
  const id = "purge-evil";
  if (document.getElementById(id)) {
    typeof bringToFront === "function" && bringToFront(document.getElementById(id));
    return;
  }
  const win = document.createElement("div");
  win.id = id;
  win.className = "window";
  Object.assign(win.style, {
    display: "flex", flexDirection: "column", width: "420px", height: "220px",
    top: "40%", left: "45%", border: "2px solid #ff0000", boxShadow: "0 0 20px rgba(255,0,0,0.5)"
  });
  win.innerHTML = `
    <div class="title" style="background: #000; border-bottom: 2px solid #ff0000;">
      <span class="title-text" style="color: #ff0000;">PURGE</span>
      <span class="controls"><span class="ctrl ctrl-close" onclick="this.closest('.window').remove()" style="background: #555; color: #fff;">&#x00D7;</span></span>
    </div>
    <div class="content" style="padding: 24px; background: #000; display: flex; justify-content: center; align-items: center; height: 100%;">
      <p id="evil-hint-text" style="font-family: 'VT323', monospace; font-size: 20px; color: #ff0000; text-align: center; line-height: 1.5; white-space: pre-wrap; margin: 0;"></p>
    </div>`;
  document.body.appendChild(win);
  if (typeof makeDraggable === "function") makeDraggable(win);
  if (typeof bringToFront === "function") bringToFront(win);
  window.purgeState++; // Increment state so we can alternate hints
  
  const textEl = win.querySelector("#evil-hint-text");
  
  let message;
  if (window.purgeState % 2 === 1) { // Will be 5, 7, 9...
    message = "I hunger for the one you threw away...\nThe loyal keeper forgotten in the dark.\nBring its bones to me.";
  } else { // Will be 4 (first time), 6, 8...
    message = "The discarded one...\nThe sleeper in the dark...\nBring it to me.";
  }

  if (typeof typewriterEffect === "function") {
    typewriterEffect(textEl, message, 50);
  } else {
    textEl.innerHTML = message.replace(/\n/g, "<br>");
  }
}

// --- STATE ---
let sacrificeCompleted = false;

/**
 * Starts the full sacrifice ritual animation sequence.
 * Called from system.js when the skull is dropped on the Sacrifice icon.
 */
function startSacrificeRitual() {
  if (sacrificeCompleted) return;
  sacrificeCompleted = true;

  // Remove the skull from the DOM
  const skull = document.getElementById("dead-dog-skull");
  if (skull) skull.remove();

  // Close all windows to clear the stage
  closeAllWindows();

  // Create the overlay
  const overlay = document.createElement("div");
  overlay.id = "sacrifice-overlay";
  overlay.innerHTML = `
    <div class="sacrifice-blood-rain" id="sacrifice-blood-rain"></div>
    <div class="sacrifice-vignette"></div>
    <div class="sacrifice-glitch-text" id="sacrifice-glitch-text"></div>
    <div class="sacrifice-final-message" id="sacrifice-final-message"></div>
  `;
  document.body.appendChild(overlay);

  // Force reflow then activate
  overlay.offsetHeight;
  overlay.classList.add("active");

  // Start the chaos phase after a brief pause
  setTimeout(() => phaseOneChaos(overlay), 1000);
}

/**
 * Phase 1: Blood rain, screen shake, evil sounds, glitch text
 */
function phaseOneChaos(overlay) {
  // Start screen shake
  document.body.classList.add("sacrifice-shake");

  // Create blood rain drops
  createBloodRain();

  // Play the evil laugh sound file
  const evilLaugh = new Audio("assets/sounds/Evil Laugh.mp3");
  evilLaugh.volume = 0.8;
  evilLaugh.play().catch(() => {});

  // Cycle through creepy messages — slow enough to read each one
  const messages = [
    "THE RITUAL HAS BEGUN",
    "THERE IS NO GOING BACK",
    "MORPHY DEMANDS BLOOD",
    "THE SACRIFICE IS COMPLETE",
    "HE IS PLEASED",
    "THE DARKNESS CONSUMES ALL",
    "YOU CHOSE THIS PATH",
  ];

  const glitchEl = document.getElementById("sacrifice-glitch-text");
  let msgIndex = 0;

  const glitchInterval = setInterval(() => {
    if (!glitchEl) return;
    glitchEl.textContent = messages[msgIndex % messages.length];
    glitchEl.style.opacity = "1";

    // Show each message for 1.2 seconds so it's readable
    setTimeout(() => {
      if (glitchEl) glitchEl.style.opacity = "0";
    }, 1200);

    msgIndex++;
  }, 1500);

  // After 8 seconds (matching the evil laugh duration), move to phase 2
  setTimeout(() => {
    clearInterval(glitchInterval);
    if (glitchEl) glitchEl.style.opacity = "0";
    document.body.classList.remove("sacrifice-shake");
    phaseTwoAftermath(overlay);
  }, 8000);
}

/**
 * Phase 2: Fade to black, final typewriter message
 */
function phaseTwoAftermath(overlay) {
  // Stop blood rain
  const rainEl = document.getElementById("sacrifice-blood-rain");
  if (rainEl) rainEl.innerHTML = "";

  // Fade overlay to solid black
  overlay.classList.add("aftermath");

  // Show final message after fade
  setTimeout(() => {
    const finalEl = document.getElementById("sacrifice-final-message");
    if (finalEl) {
      finalEl.style.opacity = "1";
      sacrificeTypewriter(
        finalEl,
        "The offering has been accepted.\nMorphy is at peace.",
        60,
        () => {
          // After message is typed, wait then fade out
          setTimeout(() => {
            overlay.classList.add("fade-out");
            setTimeout(() => {
              overlay.remove();
              // Reset trash state so it shows empty
              if (typeof trashState !== "undefined") {
                trashState.dogKilled = false;
              }
            }, 2000);
          }, 3000);
        }
      );
    }
  }, 1500);
}

/**
 * Simple typewriter for the sacrifice final message.
 */
function sacrificeTypewriter(element, text, speed, callback) {
  let i = 0;
  element.innerHTML = "";

  function type() {
    const char = text.charAt(i);
    if (char === "\n") {
      element.innerHTML += "<br>";
    } else {
      element.innerHTML += char;
    }
    i++;
    if (i < text.length) {
      setTimeout(type, speed);
    } else if (callback) {
      callback();
    }
  }
  type();
}

/**
 * Creates falling blood rain particles using DOM elements.
 */
function createBloodRain() {
  const container = document.getElementById("sacrifice-blood-rain");
  if (!container) return;

  // Create drops in waves
  function spawnWave() {
    for (let i = 0; i < 12; i++) {
      const drop = document.createElement("div");
      drop.className = "blood-drop";
      drop.style.left = Math.random() * 100 + "%";
      drop.style.animationDuration = (Math.random() * 1.5 + 1) + "s";
      drop.style.animationDelay = Math.random() * 0.3 + "s";
      drop.style.width = (Math.random() * 3 + 2) + "px";
      drop.style.height = (Math.random() * 30 + 15) + "px";
      container.appendChild(drop);

      // Remove drop after animation
      setTimeout(() => drop.remove(), 3000);
    }
  }

  // Spawn waves at a steady pace
  const rainInterval = setInterval(spawnWave, 500);
  spawnWave(); // immediate first wave

  // Stop spawning after 7.5s (before aftermath phase)
  setTimeout(() => clearInterval(rainInterval), 7500);
}


