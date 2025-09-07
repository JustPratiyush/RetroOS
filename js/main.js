// js/main.js

/**
 * Retro OS - Boot and Initialization Script
 * Handles the boot sequence and initializes the OS environment.
 */

// --- BOOT SEQUENCE ---
document.addEventListener("DOMContentLoaded", () => {
  const bootScreen = document.getElementById("boot-screen");
  const enterBtn = document.getElementById("boot-enter");
  let hasShownWelcome = false;

  function finishBoot() {
    const startupSound = new Audio("assets/sounds/startup-sound.mp3");
    startupSound.volume = 0.5;
    startupSound
      .play()
      .catch((e) => console.log("Could not play startup sound:", e));

    bootScreen.classList.add("boot-hide");
    setTimeout(() => {
      bootScreen.style.display = "none";
      initApp();

      if (!hasShownWelcome) {
        const welcomeWindow = createWindowFromTemplate(
          "welcome-template",
          "projects-container"
        ); // Assuming 'projects-container' exists
        if (welcomeWindow) {
          // Override the close function to just remove the element
          const closeBtn = welcomeWindow.querySelector(".ctrl-close");
          if (closeBtn)
            closeBtn.setAttribute(
              "onclick",
              "document.getElementById('welcome-window').remove()"
            );
        }
        hasShownWelcome = true;
      }
    }, 1000);
  }

  const progressEl = document.getElementById("boot-progress");
  const percentEl = document.getElementById("boot-percent");
  const caption = document.getElementById("boot-caption");
  let loaded = 0;
  const assets = Array.from(document.images);
  const total = assets.length;

  if (total === 0) {
    caption.textContent = "Ready to Start";
    enterBtn.style.display = "inline-block";
    enterBtn.focus();
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
            caption.textContent = "Ready to Start";
            enterBtn.style.display = "inline-block";
            enterBtn.focus();
          }, 300);
        }
      };
    });
  }

  enterBtn?.addEventListener("click", finishBoot);
  window.addEventListener("keydown", function onKey(e) {
    if (e.key === "Enter" && enterBtn?.style.display !== "none") {
      finishBoot();
      window.removeEventListener("keydown", onKey);
    }
  });
});

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
    if (!e.target.closest(".top-bar .icon") && !e.target.closest(".menu")) {
      closeAllMenus();
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
  if (typeof initCalculator === "function") initCalculator();
  if (typeof initClock === "function") initClock();
}
