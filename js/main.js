// js/main.js

/**
 * Retro OS - Boot and Initialization Script
 * Handles the boot sequence and initializes the OS environment.
 */

// --- BOOT SEQUENCE ---
document.addEventListener("DOMContentLoaded", () => {
  const bootScreen = document.getElementById("boot-screen");

  function finishBoot() {
    // NOTE: Startup sound removed from here. It plays upon successful login in js/auth.js.

    bootScreen.classList.add("boot-hide");
    setTimeout(() => {
      bootScreen.style.display = "none";

      // Initialize the App (Sets up wallpaper, icons, etc.)
      // This runs behind the now-visible login screen.
      initApp();
    }, 1000);
  }

  const progressEl = document.getElementById("boot-progress");
  const percentEl = document.getElementById("boot-percent");
  const caption = document.getElementById("boot-caption");
  let loaded = 0;
  const assets = Array.from(document.images);
  const total = assets.length;

  // Function to transition automatically
  function transitionToLogin() {
    caption.textContent = "Boot Complete";
    setTimeout(finishBoot, 500); // 500ms delay before transitioning to login
  }

  if (total === 0) {
    caption.textContent = "Ready to Start";
    transitionToLogin(); // Auto-transition if no assets
  } else {
    assets.forEach((img) => {
      const image = new Image();
      image.src = img.src;
      image.onload = image.onerror = () => {
        loaded++;
        const percent = Math.round((loaded / total) * 100);
        if (progressEl) progressEl.style.width = `${percent}%`;
        if (percentEl) percentEl.textContent = `${percent}%`;
        if (loaded === total) {
          setTimeout(() => {
            transitionToLogin(); // Auto-transition when all assets are loaded
          }, 300);
        }
      };
    });
  }

  // Removed event listeners for "ENTER" button/key.
});

// --- MAIN APP INITIALIZER ---
// --- MAIN APP INITIALIZER ---
function initApp() {
  document.querySelectorAll(".window").forEach((win) => makeDraggable(win));
  document.querySelectorAll(".desktop-icon").forEach(makeIconDraggable);

  const finderToggleBtn = document.querySelector(".finder-toggle-btn");
  const finderContentArea = document.querySelector("#finder .finder-content");

  if (finderToggleBtn && finderContentArea) {
    finderToggleBtn.addEventListener("click", () => {
      finderContentArea.classList.toggle("sidebar-visible");
    });
  }

  window.addEventListener("click", (e) => {
    // Check if clicking on status icons or status windows
    const isStatusIcon =
      e.target.closest(".status-icon") ||
      e.target.closest(".clock") ||
      e.target.closest("#battery-icon");
    const isStatusWindow = e.target.closest(".status-window");

    // Close menus if clicking outside menu/icon areas (but allow status icons to handle their own clicks)
    if (
      !e.target.closest(".top-bar .icon") &&
      !e.target.closest(".menu") &&
      !isStatusIcon
    ) {
      closeAllMenus();
      // Also close status windows when clicking outside them (but not when clicking on status icons)
      if (!isStatusWindow) {
        closeWindow("clockApp");
        closeWindow("wifiApp");
        closeWindow("batteryApp");
      }
    }
    const appDrawer = document.getElementById("app-drawer");
    const hamburgerIcon = document.getElementById("hamburger-icon");
    if (appDrawer && hamburgerIcon) {
      if (
        appDrawer.classList.contains("show") &&
        !appDrawer.contains(e.target) &&
        !e.target.closest("#hamburger-icon")
      ) {
        appDrawer.classList.remove("show");
        hamburgerIcon.classList.remove("active");
      }
    }
  });

  document
    .getElementById("internetSearchForm")
    ?.addEventListener("submit", (event) => {
      event.preventDefault();
      const queryInput = document.getElementById("internetSearchInput");
      const query = queryInput?.value.trim();
      if (!query) return;
      const url =
        query.includes(".") && !query.includes(" ")
          ? `https://${query}`
          : `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      window.open(url, "_blank");
      if (queryInput) queryInput.value = "";
    });

  const savedWallpaper = localStorage.getItem("currentWallpaper") || "1";
  setWallpaper(savedWallpaper === "alt" ? "1" : savedWallpaper);

  if (typeof renderTrashContent === "function") renderTrashContent();
  updateBatteryStatus();

  // FIX: Call the correct combined initializer if it exists, or update the clock
  if (typeof initStatusApps === "function") {
    initStatusApps();
  } else if (typeof updateClockContent === "function") {
    // Fallback if initStatusApps failed but Clock is available
    updateClockContent();
  }

  if (typeof initCalculator === "function") initCalculator();
}
