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
let matrixWallpaperCanvas = null;
let matrixWallpaperInterval = null;
let matrixWallpaperDrops = [];
const matrixWallpaperAlphabet =
  "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポャュョッ";
const matrixWallpaperFontSize = 18;

function resizeMatrixWallpaperCanvas() {
  if (!matrixWallpaperCanvas) return;

  matrixWallpaperCanvas.width = window.innerWidth;
  matrixWallpaperCanvas.height = window.innerHeight;

  const columns = Math.max(
    1,
    Math.floor(matrixWallpaperCanvas.width / matrixWallpaperFontSize)
  );
  matrixWallpaperDrops = Array.from({ length: columns }).fill(1);
}

function stopMatrixWallpaperAnimation() {
  if (matrixWallpaperInterval) {
    clearInterval(matrixWallpaperInterval);
    matrixWallpaperInterval = null;
  }

  window.removeEventListener("resize", resizeMatrixWallpaperCanvas);

  if (matrixWallpaperCanvas?.parentElement) {
    matrixWallpaperCanvas.parentElement.removeChild(matrixWallpaperCanvas);
  }

  matrixWallpaperCanvas = null;
  matrixWallpaperDrops = [];
}

function startMatrixWallpaperAnimation() {
  stopMatrixWallpaperAnimation();

  matrixWallpaperCanvas = document.createElement("canvas");
  matrixWallpaperCanvas.id = "matrix-wallpaper-canvas";

  const grain = document.querySelector(".grain");
  if (grain?.parentElement === document.body) {
    document.body.insertBefore(matrixWallpaperCanvas, grain);
  } else {
    document.body.prepend(matrixWallpaperCanvas);
  }

  const context = matrixWallpaperCanvas.getContext("2d");
  if (!context) {
    stopMatrixWallpaperAnimation();
    return;
  }

  resizeMatrixWallpaperCanvas();

  const draw = () => {
    if (!matrixWallpaperCanvas) return;

    context.fillStyle = "rgba(0, 0, 0, 0.08)";
    context.fillRect(
      0,
      0,
      matrixWallpaperCanvas.width,
      matrixWallpaperCanvas.height
    );

    context.fillStyle = "rgba(83, 255, 106, 0.72)";
    context.font = `${matrixWallpaperFontSize}px VT323, monospace`;
    context.textBaseline = "top";

    matrixWallpaperDrops.forEach((drop, index) => {
      const text = matrixWallpaperAlphabet.charAt(
        Math.floor(Math.random() * matrixWallpaperAlphabet.length)
      );
      context.fillText(
        text,
        index * matrixWallpaperFontSize,
        drop * matrixWallpaperFontSize
      );

      if (
        drop * matrixWallpaperFontSize > matrixWallpaperCanvas.height &&
        Math.random() > 0.975
      ) {
        matrixWallpaperDrops[index] = 0;
      }

      matrixWallpaperDrops[index] += 1;
    });
  };

  matrixWallpaperInterval = setInterval(draw, 60);
  window.addEventListener("resize", resizeMatrixWallpaperCanvas);
}

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

  if (isActive) {
    startMatrixWallpaperAnimation();
  } else {
    stopMatrixWallpaperAnimation();
  }

  const title = isActive ? "Matrix Protocol Engaged" : "Matrix Protocol Offline";
  const message = isActive
    ? "Signal acquired. RetroOS has switched to the hidden Matrix shell. Enter the code again to return to the standard desktop."
    : "Matrix shell disengaged. Standard RetroOS rendering restored.";
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

function clearDesktopIconSelection(activeIcon = null) {
  document.querySelectorAll(".desktop-icon.selected").forEach((icon) => {
    icon.classList.toggle("selected", icon === activeIcon);
  });
}

function selectDesktopIcon(icon) {
  if (!icon) return;
  clearDesktopIconSelection(icon);
}

function activateIconAction(action, target = "", options = {}) {
  switch (action) {
    case "window":
      openWindow(target);
      break;
    case "url":
      if (target) window.open(target, "_blank");
      break;
    case "readme":
      openReadMe();
      break;
    case "projects":
      openProjectsFolder();
      break;
    case "socials":
      toggleSocialsFolder(options.event);
      break;
    case "finder-location":
      if (typeof selectFinderLocation === "function") {
        selectFinderLocation(target);
      } else {
        renderFinderContent(target);
      }
      break;
    case "photo":
      openPhotoViewer(target, options.title);
      break;
    case "purge":
      handlePurgeAction();
      break;
  }
}

function activateDesktopIcon(icon, options = {}) {
  if (!icon) return;

  const fallbackActions = {
    "icon-readme": { action: "readme" },
    "icon-projects": { action: "projects" },
  };
  const fallback = fallbackActions[icon.id] || {};
  const action = icon.dataset.openAction || fallback.action || "";
  const target = icon.dataset.openTarget || fallback.target || "";

  activateIconAction(action, target, options);
}

/**
 * Clones an HTML <template> element and appends it to a container.
 * Registers the new window with makeDraggable and bringToFront.
 * @param {string} templateId - ID of the <template> element.
 * @param {string} containerId - ID of the container to append into.
 * @returns {HTMLElement|null} The cloned window element.
 */
function createWindowFromTemplate(templateId, containerId) {
  const template = document.getElementById(templateId);
  const container = document.getElementById(containerId);
  if (!template || !container) return null;
  const clone = template.content.cloneNode(true);
  const windowEl = clone.querySelector(".window");
  container.appendChild(clone);
  makeDraggable(windowEl);
  bringToFront(windowEl);
  return windowEl;
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
    
    // Resume window notes if music is already playing
    if (typeof isMusicPlaying === "function" && typeof startWindowNoteLoop === "function" && isMusicPlaying()) {
      startWindowNoteLoop();
    }
  }
  const currentState = windowStates[id] || "closed";
  if (currentState === "minimized" || currentState === "closed") {
    el.style.display = "block";
    windowStates[id] = "open";
    setAppIconActive(id, true);
    if (id === "finder") renderFinderContent("desktop");
    if (id === "trash") renderTrashContent();
    if (id === "guestbook" && typeof renderGuestbook === "function") renderGuestbook();
    if (id === "noticeboard" && typeof renderNoticeboard === "function") renderNoticeboard();
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
  updateFullscreenState();
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
  updateFullscreenState();
}

/**
 * Toggles a window between maximized (full viewport) and its original size/position.
 * @param {string} id - The window ID.
 */
function maximizeWindow(id) {
  const el = document.getElementById(id);
  if (!el) return;

  if (el.classList.contains("maximized")) {
    // Restore original dimensions
    el.classList.remove("maximized");
    el.style.left = el.dataset.origLeft || "";
    el.style.top = el.dataset.origTop || "";
    el.style.width = el.dataset.origWidth || "";
    el.style.height = el.dataset.origHeight || "";
  } else {
    // Save current dimensions
    el.dataset.origLeft = el.style.left;
    el.dataset.origTop = el.style.top;
    el.dataset.origWidth = el.style.width;
    el.dataset.origHeight = el.style.height;

    // Maximize (true fullscreen)
    el.classList.add("maximized");
    el.style.left = "0";
    el.style.top = "0";
    el.style.width = "100vw";
    el.style.height = "100vh";
  }
  bringToFront(el);
  updateFullscreenState();
}

/**
 * Checks if any window is maximized and hides the dock and top bar if true.
 */
function updateFullscreenState() {
  const dock = document.querySelector(".dock");
  const topBar = document.querySelector(".top-bar");
  
  const maximizedWindows = Array.from(document.querySelectorAll(".window.maximized"));
  const hasVisibleMaximized = maximizedWindows.some(win => windowStates[win.id] === "open");
  
  if (hasVisibleMaximized) {
    if (dock) dock.style.display = "none";
    if (topBar) topBar.style.display = "none";
  } else {
    if (dock) dock.style.display = "flex";
    if (topBar) topBar.style.display = "flex";
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

  closeAllMenus();
  ["clockApp", "wifiApp", "batteryApp"].forEach(w => closeWindow(w));

  if ((windowStates[id] || "closed") === "open") { closeWindow(id); return; }

  const refreshers = {
    clockApp:   () => typeof updateClockContent   === "function" && updateClockContent(true),
    batteryApp: () => typeof updateBatteryContent === "function" && updateBatteryContent(true),
    wifiApp:    () => typeof updateWifiContent    === "function" && updateWifiContent(),
  };
  refreshers[id]?.();

  const rect = iconEl.getBoundingClientRect();
  const rightIcons = document.querySelector(".top-bar .right-icons")?.getBoundingClientRect();
  if (!rightIcons) return;

  const windowWidth = id === "clockApp" ? 320 : 250;
  Object.assign(el.style, {
    right:    window.innerWidth - rightIcons.right + "px",
    top:      rect.bottom + 5 + "px",
    width:    windowWidth + "px",
    position: "absolute",
    left:     "auto",
    transform: "none",
    display:  "block",
  });
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
    // Ignore header interactions that are meant for controls and inputs.
    if (
      e.target.closest(
        ".ctrl, .title-interactive, button, input, textarea, select, a, label, form"
      )
    ) {
      return;
    }

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
  const dragThreshold = 6;
  const activationCooldown = 350;
  let isDragging = false;
  let didDrag = false;
  let suppressClick = false;
  let lastActivationTime = 0;
  let offX = 0,
    offY = 0;
  let startX = 0,
    startY = 0; // Used to tell a tap from a drag
  let startLeft = 0;

  function activateFromClick(event) {
    const now = Date.now();
    if (now - lastActivationTime < activationCooldown) return;
    lastActivationTime = now;
    activateDesktopIcon(icon, { event });
  }

  icon.addEventListener(
    "click",
    (e) => {
      if (suppressClick) {
        suppressClick = false;
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }

      selectDesktopIcon(icon);
      activateFromClick(e);
    },
    true
  );

  // This function handles the start of a drag or a tap
  function dragStart(e) {
    if (e.button !== undefined && e.button !== 0) return;

    const event = e.touches ? e.touches[0] : e;

    // Record the starting position
    startX = event.clientX;
    startY = event.clientY;

    isDragging = true;
    didDrag = false;
    const rect = icon.getBoundingClientRect();
    offX = event.clientX - rect.left;
    offY = event.clientY - rect.top;
    startLeft = rect.left;
    selectDesktopIcon(icon);
    document.body.style.userSelect = "none";

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
    const movedDistance = Math.hypot(
      event.clientX - startX,
      event.clientY - startY
    );

    if (!didDrag && movedDistance >= dragThreshold) {
      didDrag = true;
      icon.classList.add("dragging");

      if (icon.style.right) {
        icon.style.left = `${startLeft}px`;
        icon.style.right = "";
      }
    }

    if (!didDrag) return;

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
    document.body.style.userSelect = "";
    icon.classList.remove("dragging");

    // Use changedTouches for touchend, as 'touches' will be empty
    const event = e.changedTouches ? e.changedTouches[0] : e;

    // Check how far the icon was moved
    const movedDistance = Math.hypot(
      event.clientX - startX,
      event.clientY - startY
    );

    if (movedDistance >= dragThreshold || didDrag) {
      suppressClick = true;
      return;
    }

  }

  // Add the initial listeners to the icon
  icon.addEventListener("mousedown", dragStart);
  icon.addEventListener("touchstart", dragStart, { passive: false });
}

/**
 * Makes the skull icon draggable. On first drag, reparents the skull from
 * the trash window to document.body so it can be freely moved across the desktop.
 * @param {HTMLElement} skull - The skull container element (#dead-dog-skull).
 */
function makeSkullDraggable(skull) {
  let isDragging = false;
  let offX = 0, offY = 0;
  let hasBeenReparented = false;

  function dragStart(e) {
    if (e.type === "touchstart") e.preventDefault();
    const event = e.touches ? e.touches[0] : e;

    isDragging = true;

    if (!hasBeenReparented) {
      // Reparent: move skull from inside trash to document.body
      const rect = skull.getBoundingClientRect();
      skull.remove();
      document.body.appendChild(skull);
      skull.classList.add("skull-on-desktop");
      skull.style.position = "absolute";
      skull.style.left = `${rect.left + window.scrollX}px`;
      skull.style.top = `${rect.top + window.scrollY}px`;
      skull.style.zIndex = String(++zTop);
      hasBeenReparented = true;
    }

    offX = event.clientX - skull.getBoundingClientRect().left;
    offY = event.clientY - skull.getBoundingClientRect().top;

    skull.style.zIndex = String(++zTop);
    document.body.style.userSelect = "none";

    window.addEventListener("mousemove", dragMove);
    window.addEventListener("mouseup", dragEnd);
    window.addEventListener("touchmove", dragMove, { passive: false });
    window.addEventListener("touchend", dragEnd);
  }

  function dragMove(e) {
    if (!isDragging) return;
    if (e.type === "touchmove") e.preventDefault();
    const event = e.touches ? e.touches[0] : e;
    skull.style.left = `${event.clientX - offX}px`;
    skull.style.top = `${event.clientY - offY}px`;
  }

  function dragEnd(e) {
    isDragging = false;
    document.body.style.userSelect = "auto";
    window.removeEventListener("mousemove", dragMove);
    window.removeEventListener("mouseup", dragEnd);
    window.removeEventListener("touchmove", dragMove);
    window.removeEventListener("touchend", dragEnd);

    // Check if dropped over the Sacrifice icon or Finder Documents
    if (hasBeenReparented && typeof startSacrificeRitual === "function") {
      const skullRect = skull.getBoundingClientRect();
      const skullCenterX = skullRect.left + skullRect.width / 2;
      const skullCenterY = skullRect.top + skullRect.height / 2;

      const sacrificeIcon = document.getElementById("sacrifice-app-icon");

      // Direct drop on Sacrifice icon
      if (sacrificeIcon) {
        const iconRect = sacrificeIcon.getBoundingClientRect();
        if (
          skullCenterX >= iconRect.left && skullCenterX <= iconRect.right &&
          skullCenterY >= iconRect.top && skullCenterY <= iconRect.bottom
        ) {
          animateSkullToSacrifice(skull, sacrificeIcon);
          return;
        }
      }

      // Check if dropped over Finder window while Documents is active
      const finderWindow = document.getElementById("finder");
      if (finderWindow && finderWindow.style.display !== "none") {
        const finderRect = finderWindow.getBoundingClientRect();
        if (
          skullCenterX >= finderRect.left && skullCenterX <= finderRect.right &&
          skullCenterY >= finderRect.top && skullCenterY <= finderRect.bottom
        ) {
          // Check if Documents tab is active
          const activeTab = finderWindow.querySelector(".sidebar-item.active");
          if (activeTab && activeTab.textContent.trim().toLowerCase() === "documents") {
            // Auto-navigate to documents if needed and transport skull
            if (sacrificeIcon) {
              animateSkullToSacrifice(skull, sacrificeIcon);
            } else {
              // Sacrifice icon not rendered yet — render documents, then transport
              renderFinderContent("documents");
              const newIcon = document.getElementById("sacrifice-app-icon");
              if (newIcon) {
                animateSkullToSacrifice(skull, newIcon);
              }
            }
            return;
          }
        }
      }
    }
  }

  /**
   * Animates the skull flying to the Sacrifice icon, then triggers the ritual.
   */
  function animateSkullToSacrifice(skullEl, targetIcon) {
    const iconRect = targetIcon.getBoundingClientRect();
    const targetX = iconRect.left + iconRect.width / 2 - skullEl.offsetWidth / 2;
    const targetY = iconRect.top + iconRect.height / 2 - skullEl.offsetHeight / 2;

    // Highlight the sacrifice icon
    targetIcon.classList.add("sacrifice-receiving");

    // Animate the skull flying to the icon
    skullEl.style.transition = "left 0.5s ease-in, top 0.5s ease-in, opacity 0.5s ease-in";
    skullEl.style.left = targetX + "px";
    skullEl.style.top = targetY + "px";
    skullEl.style.opacity = "0.3";

    setTimeout(() => {
      skullEl.style.transition = "";
      targetIcon.classList.remove("sacrifice-receiving");
      startSacrificeRitual();
    }, 600);
  }

  skull.addEventListener("mousedown", dragStart);
  skull.addEventListener("touchstart", dragStart, { passive: false });
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
        `<strong>Retro OS v2.1</strong><br>Created by Abhinav Kuchhal.<br><br>An interactive operating system sandbox inspired by classic Mac OS. Enjoy your stay!`
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
 * Updates the battery icon and popover content.
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

function setWallpaper(style, isManual = false) {
  let idx;
  if (style === "classic") {
    idx = 0;
    document.body.style.filter = "grayscale(100%)";
    // Inform the user about the classic theme only on manual click
    if (isManual) {
      setTimeout(() => {
        createMessageWindow(
          "OG Mac Look",
          "<strong>System Theme Updated!</strong><br><br>You have successfully enabled the original 1990s Macintosh GUI look. Enjoy the nostalgia!"
        );
      }, 100);
    }
  } else if (style === "custom") {
    const customData = localStorage.getItem("customWallpaper");
    if (customData) {
      document.body.style.backgroundImage = `url('${customData}')`;
      document.body.style.filter = "none";
      localStorage.setItem("currentWallpaper", "custom");
      return;
    }
    idx = 1; // Fallback if no custom data
    document.body.style.filter = "none";
  } else if (style === "alt") {
    idx = (currentWallpaperIndex % 5) + 1;
    document.body.style.filter = "none";
  } else if (!isNaN(style) && style >= 0 && style <= 5) {
    idx = parseInt(style, 10);
    document.body.style.filter = "none";
  } else {
    return;
  }

  document.body.style.backgroundImage = `url('assets/wallpapers/wallpaper${idx}.webp')`;
  currentWallpaperIndex = idx;
  localStorage.setItem("currentWallpaper", idx === 0 ? "classic" : String(idx));
  localStorage.setItem("currentWallpaperIndex", String(idx));
}

function handleCustomWallpaperUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const dataUrl = e.target.result;
    document.body.style.backgroundImage = `url('${dataUrl}')`;
    document.body.style.filter = "none";
    
    localStorage.setItem("customWallpaper", dataUrl);
    localStorage.setItem("currentWallpaper", "custom");
  };
  reader.readAsDataURL(file);
}

// Photo Viewer Logic — creates a new window per photo
let _photoViewerCount = 0;
function openPhotoViewer(src, title) {
  const id = `photo-viewer-${++_photoViewerCount}`;
  const offset = ((_photoViewerCount - 1) % 8) * 24; // cascade offset so windows don't stack perfectly

  const win = document.createElement("div");
  win.id = id;
  win.className = "window";
  Object.assign(win.style, {
    display: "block",
    width: "600px",
    height: "450px",
    top: `calc(10% + ${offset}px)`,
    left: `calc(15% + ${offset}px)`,
  });

  win.innerHTML = `
    <div class="title">
      <span class="title-text">${title || "Photo Viewer"}</span>
      <span class="controls">
        <span class="ctrl ctrl-min" onclick="minimizeWindow('${id}')">&#x2212;</span>
        <span class="ctrl ctrl-max" onclick="maximizeWindow('${id}')"><strong style="font-family:Arial,sans-serif;">O</strong></span>
        <span class="ctrl ctrl-close" onclick="this.closest('.window').remove()">&#x00D7;</span>
      </span>
    </div>
    <div class="content photo-viewer-content">
      <img src="${src}" alt="${title || 'Photo'}" style="width:100%;height:100%;object-fit:contain;" />
    </div>`;


  document.body.appendChild(win);
  makeDraggable(win);
  bringToFront(win);
}

// Android-style Socials Folder
function toggleSocialsFolder(e) {
  e?.stopPropagation?.();
  const popup = document.getElementById("socials-popup");
  if (!popup) return;

  if (popup.style.display === "none" || popup.style.display === "") {
    // Create overlay
    const overlay = document.createElement("div");
    overlay.className = "socials-overlay";
    overlay.id = "socials-overlay";
    overlay.onclick = () => closeSocialsFolder();
    document.body.appendChild(overlay);

    popup.style.display = "block";
  } else {
    closeSocialsFolder();
  }
}

function closeSocialsFolder() {
  const popup = document.getElementById("socials-popup");
  const overlay = document.getElementById("socials-overlay");
  if (popup) popup.style.display = "none";
  if (overlay) overlay.remove();
}
