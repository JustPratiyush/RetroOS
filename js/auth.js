// js/auth.js

/**
 * Handles the Login Screen functionality.
 * The login screen is now visible by default via HTML/CSS to prevent flicker.
 */

document.addEventListener("DOMContentLoaded", () => {
  const passwordInput = document.getElementById("login-password");
  const loginScreen = document.getElementById("login-screen");

  if (passwordInput) {
    // Focus input after a slight delay to allow the boot screen to transition away
    // (1500ms delay to ensure the desktop behind it is fully rendered after boot)
    setTimeout(() => {
      passwordInput.focus();
    }, 1500);

    // Listen for Enter key press on the input field
    passwordInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        attemptLogin();
      }
    });
  } else {
    console.error("Login input element (#login-password) not found!");
  }

  // Global Enter key handler - works regardless of focus when login screen is visible
  window.addEventListener("keydown", (e) => {
    // Check if login screen is visible (not hidden and not fully transparent)
    if (loginScreen) {
      const isDisplayed =
        loginScreen.style.display !== "none" &&
        getComputedStyle(loginScreen).display !== "none";
      const isVisible =
        loginScreen.style.opacity !== "0" &&
        getComputedStyle(loginScreen).opacity !== "0";

      if (isDisplayed && isVisible && e.key === "Enter") {
        e.preventDefault();
        attemptLogin();
      }
    }
  });
});

function attemptLogin() {
  const loginScreen = document.getElementById("login-screen");
  const passwordInput = document.getElementById("login-password");

  // Simulate processing delay
  if (passwordInput) passwordInput.disabled = true;

  setTimeout(() => {
    // Success - Fade out
    if (loginScreen) loginScreen.style.opacity = "0";

    // Play startup sound upon successful login (Desktop reveal)
    const startupSound = new Audio("assets/sounds/startup-sound.mp3");
    startupSound.volume = 0.5;
    startupSound
      .play()
      .catch((e) => console.log("Could not play startup sound:", e));

    setTimeout(() => {
      // Finally hide the element completely
      if (loginScreen) loginScreen.style.display = "none";

      // Show welcome window after successful login
      showWelcomeWindow();
    }, 500);
  }, 600);
}

function showWelcomeWindow() {
  // Check if welcome window already exists
  const existingWindow = document.getElementById("welcome-window");
  if (existingWindow) {
    if (typeof bringToFront === "function") {
      bringToFront(existingWindow);
    }
    return;
  }

  // Create welcome window from template
  if (typeof createWindowFromTemplate === "function") {
    const welcomeWindow = createWindowFromTemplate(
      "welcome-template",
      "projects-container"
    );
    if (welcomeWindow) {
      // Override the close function to just remove the element
      const closeBtn = welcomeWindow.querySelector(".ctrl-close");
      if (closeBtn) {
        closeBtn.setAttribute(
          "onclick",
          "document.getElementById('welcome-window').remove()"
        );
      }
    }
  } else {
    // Fallback: create welcome window manually if template function is not available
    console.warn(
      "createWindowFromTemplate not available, welcome window may not appear"
    );
  }
}
