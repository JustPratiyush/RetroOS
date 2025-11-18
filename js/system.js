// js/system.js

// At the top of js/system.js

const konamiCode = [
  "arrowUp",
  "arrowUp",
  "arrowDown",
  "arrowDown",
  "arrowLeft",
  "arrowRight",
  "arrowLeft",
  "arrowRight",
  "b",
  "a",
];
let konamiIndex = 0;

// --- CORE OS STATE & GLOBALS ---
let zTop = 1000;
const windowStates = {}; // States: 'closed', 'open', 'minimized'
let isTerminalInitialized = false;
let currentWallpaperState = localStorage.getItem("currentWallpaper") || "1";
let currentWallpaperIndex = parseInt(
  localStorage.getItem("currentWallpaperIndex") || "1",
  10
);

/**
 * Closes all currently open or minimized windows.
 * @param {string[]} exceptions - An array of window IDs to keep open.
 */
function closeAllWindows(exceptions = []) {
  // The 'windowStates' object tracks the status of all windows
  for (const windowId in windowStates) {
    if (
      !exceptions.includes(windowId) &&
      (windowStates[windowId] === "open" ||
        windowStates[windowId] === "minimized")
    ) {
      closeWindow(windowId);
    }
  }
}

function activateMatrixTheme() {
  // Close all windows to reduce distraction before showing the alert
  closeAllWindows();

  document.body.classList.toggle("matrix-theme");
  const isActive = document.body.classList.contains("matrix-theme");
  const title = "System Security Alert";
  const message = isActive
    ? "Reality glitch detected. Engaging fallback simulation... Welcome to the Matrix."
    : "Simulation disengaged. Welcome back to reality.";
  createMessageWindow(title, message);
}

window.addEventListener("keydown", (e) => {
  if (e.key.toLowerCase() === konamiCode[konamiIndex].toLowerCase()) {
    konamiIndex++;
    if (konamiIndex === konamiCode.length) {
      activateMatrixTheme();
      konamiIndex = 0;
    }
  } else {
    konamiIndex = 0;
  }
});

// --- WINDOW & ICON MANAGEMENT ---

function bringToFront(el) {
  if (!el) return;
  zTop += 1;
  el.style.zIndex = zTop;
}

function setAppIconActive(appName, isActive) {
  const allIcons = document.querySelectorAll(
    `.dock-icon[data-app="${appName}"]`
  );
  if (allIcons.length === 0) return;
  allIcons.forEach((icon) => icon.classList.remove("active"));
  if (isActive) {
    const visibleIcon = Array.from(allIcons).find(
      (icon) => icon.offsetParent !== null
    );
    if (visibleIcon) {
      visibleIcon.classList.add("active");
    }
  }
}

function openWindow(id) {
  const el = document.getElementById(id);
  if (!el) return;
  if (id === "music") {
    if (typeof stopDockNoteLoop === "function") {
      stopDockNoteLoop();
    }
    createMusicPlayer();
  }
  const currentState = windowStates[id] || "closed";
  if (currentState === "minimized" || currentState === "closed") {
    el.style.display = "block";
    windowStates[id] = "open";
    setAppIconActive(id, true);
    if (id === "finder") renderFinderContent("desktop");
    if (id === "trash") renderTrashContent();
    if (id === "terminal" && !isTerminalInitialized) {
      initTerminal();
      isTerminalInitialized = true;
    }
    if (id === "terminal") focusTerminal();
  }
  bringToFront(el);
  const appDrawer = document.getElementById("app-drawer");
  const hamburgerIcon = document.getElementById("hamburger-icon");
  if (appDrawer && appDrawer.classList.contains("show")) {
    appDrawer.classList.remove("show");
    hamburgerIcon.classList.remove("active");
  }
}

function closeWindow(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = "none";
  windowStates[id] = "closed";
  setAppIconActive(id, false);
  if (id === "music") {
    destroyMusicPlayer();
  }
  if (id === "projects" || id === "readme") {
    el.parentElement?.removeChild(el);
  }
}

function minimizeWindow(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.display = "none";
  windowStates[id] = "minimized";
  setAppIconActive(id, true);
  if (id === "music") {
    stopWindowNoteLoop();
    if (typeof isMusicPlaying === "function" && isMusicPlaying()) {
      startDockNoteLoop();
    }
  }
}

function createMessageWindow(title, message) {
  const id = "msg_" + Date.now();
  const win = document.createElement("div");
  win.className = "window";
  win.id = id;
  win.style.cssText = "display:block; left:220px; top:160px; width:340px;";
  win.innerHTML = `<div class="title"><span>${title}</span><span class="controls"><span class="ctrl ctrl-close" title="Close" onclick="document.getElementById('${id}').remove()">×</span></span></div><div class="content" style="padding: 15px;">${message}</div>`;
  document.body.appendChild(win);
  makeDraggable(win);
  bringToFront(win);
}

/**
 * Opens a status popover window (Battery, Wi-Fi, Clock) right below its icon.
 * @param {string} id - The ID of the window to open (e.g., 'batteryApp').
 * @param {HTMLElement} iconEl - The top bar icon element that was clicked.
 */
function openStatusWindow(id, iconEl) {
  const el = document.getElementById(id);
  if (!el) return;

  // Close all open menus/popovers before opening a new one
  closeAllMenus();
  closeWindow("clockApp");
  closeWindow("wifiApp");
  closeWindow("batteryApp");

  // Check if the window was already open (to toggle it off)
  const currentState = windowStates[id] || "closed";
  if (currentState === "open") {
    closeWindow(id);
    return;
  }

  // Update content for the specific app before opening
  if (id === "clockApp" && typeof updateClockContent === "function") {
    updateClockContent(true); // Forces a content refresh
  }
  if (id === "batteryApp" && typeof updateBatteryContent === "function") {
    updateBatteryContent(true); // Forces a content refresh
  }
  if (id === "wifiApp" && typeof updateWifiContent === "function") {
    updateWifiContent(); // Forces a content refresh
  }

  // Position the window right below the icon
  const rect = iconEl.getBoundingClientRect();
  const rightIconsEl = document.querySelector(".top-bar .right-icons");

  if (!rightIconsEl) {
    console.error("Could not find .top-bar .right-icons element");
    return;
  }

  const rightIcons = rightIconsEl.getBoundingClientRect();

  // Calculate position: align the right edge of the window with the right edge of the icons container
  // Use appropriate width for each popover (clock needs more space)
  const windowWidth = id === "clockApp" ? 320 : 250;
  el.style.right = window.innerWidth - rightIcons.right + "px";
  el.style.top = rect.bottom + 5 + "px";
  el.style.width = windowWidth + "px";
  el.style.position = "absolute"; // Ensure it positions relative to the body/viewport
  el.style.left = "auto"; // Reset left to ensure right positioning works
  el.style.transform = "none"; // Remove any transform that might interfere with positioning

  // Open the window
  el.style.display = "block";
  windowStates[id] = "open";
  bringToFront(el);
}

// --- DRAGGABILITY ---

function makeDraggable(win) {
  // Status windows should not be draggable
  if (win.classList.contains("status-window")) return;

  const header = win.querySelector(".title");
  if (!header) return;

  let isDown = false;
  let offX = 0;
  let offY = 0;

  function dragStart(e) {
    // Ignore clicks/touches on the window control buttons
    if (e.target.classList.contains("ctrl")) return;

    // Prevent default browser actions (like scrolling) on touch
    if (e.type === "touchstart") {
      e.preventDefault();
    }

    const event = e.touches ? e.touches[0] : e;

    isDown = true;
    bringToFront(win);

    offX = event.clientX - win.offsetLeft;
    offY = event.clientY - win.offsetTop;

    document.body.style.userSelect = "none";

    // Add move and end listeners to the window ONLY when drag starts
    window.addEventListener("mousemove", dragMove);
    window.addEventListener("mouseup", dragEnd);
    window.addEventListener("touchmove", dragMove, { passive: false });
    window.addEventListener("touchend", dragEnd);
  }

  function dragMove(e) {
    if (!isDown) return;

    // Prevent scrolling while dragging on touch devices
    if (e.type === "touchmove") {
      e.preventDefault();
    }

    const event = e.touches ? e.touches[0] : e;

    // Use template literals for setting styles
    win.style.left = `${event.clientX - offX}px`;
    win.style.top = `${event.clientY - offY}px`;
  }

  function dragEnd() {
    isDown = false;
    document.body.style.userSelect = "auto";

    // REMOVE move and end listeners from the window when drag ends
    window.removeEventListener("mousemove", dragMove);
    window.removeEventListener("mouseup", dragEnd);
    window.removeEventListener("touchmove", dragMove);
    window.removeEventListener("touchend", dragEnd);
  }

  // Attach only the "start" listeners initially
  header.addEventListener("mousedown", dragStart);
  header.addEventListener("touchstart", dragStart, { passive: false });
}

function makeIconDraggable(icon) {
  let isDragging = false;
  let offX = 0,
    offY = 0;
  let startX = 0,
    startY = 0; // Used to tell a tap from a drag

  // This function opens the correct window
  const openIcon = () => {
    if (icon.id === "icon-projects") {
      openProjectsFolder();
    } else if (icon.id === "icon-readme") {
      openReadMe();
    }
  };

  // For desktop, the standard double-click is best
  icon.addEventListener("dblclick", openIcon);

  // This function handles the start of a drag or a tap
  function dragStart(e) {
    const event = e.touches ? e.touches[0] : e;

    // Record the starting position
    startX = event.clientX;
    startY = event.clientY;

    isDragging = true;
    const rect = icon.getBoundingClientRect();
    offX = event.clientX - rect.left;
    offY = event.clientY - rect.top;

    if (icon.style.right) {
      icon.style.left = `${rect.left}px`;
      icon.style.right = "";
    }

    // Add listeners to the whole window to track movement
    window.addEventListener("mousemove", dragMove);
    window.addEventListener("touchmove", dragMove, { passive: false });
    window.addEventListener("mouseup", dragEnd);
    window.addEventListener("touchend", dragEnd);
  }

  function dragMove(e) {
    if (!isDragging) return;
    if (e.type === "touchmove") e.preventDefault(); // Prevent page scroll

    const event = e.touches ? e.touches[0] : e;
    icon.style.left = `${event.clientX - offX}px`;
    icon.style.top = `${event.clientY - offY}px`;
  }

  // This function handles the end of a drag or tap
  function dragEnd(e) {
    if (!isDragging) return;
    isDragging = false;

    // Clean up the listeners
    window.removeEventListener("mousemove", dragMove);
    window.removeEventListener("touchmove", dragMove);
    window.removeEventListener("mouseup", dragEnd);
    window.removeEventListener("touchend", dragEnd);

    // Use changedTouches for touchend, as 'touches' will be empty
    const event = e.changedTouches ? e.changedTouches[0] : e;

    // Check how far the icon was moved
    const movedDistance = Math.hypot(
      event.clientX - startX,
      event.clientY - startY
    );

    // If it was a touch event and the icon barely moved, it's a tap!
    if (e.type === "touchend" && movedDistance < 10) {
      openIcon();
    }
  }

  // Add the initial listeners to the icon
  icon.addEventListener("mousedown", dragStart);
  icon.addEventListener("touchstart", dragStart, { passive: false });
}

// --- DESKTOP & UI MANAGEMENT ---

function toggleMenu(menuId, el) {
  const menu = document.getElementById(menuId);
  if (!menu) return;
  const isOpen = menu.style.display === "block";
  closeAllMenus();
  if (isOpen) return;
  const rect = el.getBoundingClientRect();
  menu.style.left = Math.max(6, rect.left) + "px";
  menu.style.top = rect.bottom + "px";
  menu.style.display = "block";
  el.classList.add("active");
  bringToFront(menu);
}

function closeAllMenus() {
  document.querySelectorAll(".menu").forEach((m) => (m.style.display = "none"));
  document
    .querySelectorAll(".top-bar .icon")
    .forEach((i) => i.classList.remove("active"));

  // Also close all status popovers when a menu is clicked
  closeWindow("clockApp");
  closeWindow("wifiApp");
  closeWindow("batteryApp");
}

function menuAction(action) {
  closeAllMenus();
  switch (action) {
    case "About This Mac":
      createMessageWindow(
        "About This Mac",
        `<strong>Retro OS v2.1</strong><br>Created by Abhinav Kuchhal.<br><br>A fun, interactive portfolio website inspired by classic Mac OS. Enjoy your stay!`
      );
      break;
    case "System Info":
      createMessageWindow(
        "System Info",
        `<strong>Processor:</strong> 1.21 GHz PowerPC (Emulated)<br><strong>Memory:</strong> 128 MB VRAM (Virtual RAM)<br><strong>Graphics:</strong> Imagination Engine II <br><strong>Serial Number:</strong> AK47000593`
      );
      break;
    case "Licenses":
      createMessageWindow(
        "Licenses",
        `<strong style="font-size: 16px; font-family: monospace;">© 2025 ABHINAV KUCHHAL</strong><br><br>All icons and images are used for personal, non-commercial purposes. Fonts are from Google Fonts. This project is a tribute and not affiliated with Apple Inc.<br><br><strong style="font-family: monospace;">All Rights Reserved.</strong>`
      );
      break;
    case "Shut Down":
      createMessageWindow(
        "Shut Down",
        'Shut down functionality is disabled in this demo. <br><br> <button onclick="window.close()">Proceed Anyway</button>'
      );
      break;
    default:
      break;
  }
}

/**
 * Updates the battery icon and calls the function to update the popover content.
 */
/**
 * Updates the battery icon and calls the function to update the popover content.
 */
function updateBatteryStatus() {
  if (!("getBattery" in navigator)) {
    const batteryIconEl = document.getElementById("battery-icon");
    if (batteryIconEl) batteryIconEl.style.display = "none";
    return;
  }
  navigator.getBattery().then(function (battery) {
    const batteryLevelEl = document.getElementById("battery-level");
    const batteryIconEl = document.getElementById("battery-icon");

    function updateAllBatteryInfo() {
      if (!batteryLevelEl || !batteryIconEl) return;

      const levelPercent = Math.round(battery.level * 100);
      batteryLevelEl.style.width = levelPercent + "%";
      batteryLevelEl.style.backgroundColor =
        levelPercent < 20 ? "#ff6b6b" : "#32cd32";
      batteryIconEl.title = `Battery: ${levelPercent}% ${
        battery.charging ? "(Charging)" : ""
      }`;

      // Safety check added: only call updateBatteryContent if the function exists
      if (
        windowStates["batteryApp"] === "open" &&
        typeof updateBatteryContent === "function"
      ) {
        updateBatteryContent();
      }
    }

    updateAllBatteryInfo();
    battery.addEventListener("levelchange", updateAllBatteryInfo);
    battery.addEventListener("chargingchange", updateAllBatteryInfo);
  });
}

function toggleAppDrawer() {
  const appDrawer = document.getElementById("app-drawer");
  const hamburgerIcon = document.getElementById("hamburger-icon");
  if (!appDrawer || !hamburgerIcon) return;
  appDrawer.classList.toggle("show");
  hamburgerIcon.classList.toggle("active");
}

// --- SETTINGS ---

function setWallpaper(style) {
  let wallpaperIndex;
  if (style === "classic") {
    wallpaperIndex = 0;
  } else if (style === "alt") {
    // Assumes wallpapers are named wallpaper1 through wallpaper5
    wallpaperIndex = (currentWallpaperIndex % 5) + 1;
  } else if (!isNaN(style) && style >= 0 && style <= 5) {
    wallpaperIndex = parseInt(style, 10);
  } else {
    return; // Invalid style
  }

  document.body.style.backgroundImage = `url('assets/wallpapers/wallpaper${wallpaperIndex}.webp')`;
  currentWallpaperIndex = wallpaperIndex;
  localStorage.setItem(
    "currentWallpaper",
    wallpaperIndex === 0 ? "classic" : String(wallpaperIndex)
  );
  localStorage.setItem("currentWallpaperIndex", String(wallpaperIndex));
}

function toggleGrayscale(isChecked) {
  document.body.style.filter = isChecked ? "grayscale(100%)" : "none";
}
