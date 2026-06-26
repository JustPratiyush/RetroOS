// js/auth.js

/**
 * Handles the Login Screen functionality.
 * The login screen is now visible by default via HTML/CSS to prevent flicker.
 */

let loginRequestInFlight = false;

// Secret bypass password. Typing this on the login screen instantly wakes
// Morphy (the desktop dog companion) without solving the Trash easter egg.
const MORPHY_SECRET_PASSWORD = "morphy";

function setAdminMode(enabled) {
  const nextValue = Boolean(enabled);
  const previousValue = Boolean(window.isAdminMode);

  window.isAdminMode = nextValue;

  if (document.body) {
    document.body.classList.toggle("admin-mode", nextValue);
  }

  if (previousValue !== nextValue) {
    window.dispatchEvent(
      new CustomEvent("retroos:admin-state-changed", {
        detail: { isAdminMode: nextValue },
      })
    );
  }
}

async function syncAdminSessionState() {
  try {
    const res = await fetch("/api/admin/session", {
      method: "GET",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      setAdminMode(false);
      return false;
    }

    const data = await res.json();
    setAdminMode(Boolean(data.authenticated));
    return Boolean(data.authenticated);
  } catch (error) {
    console.warn("RetroOS admin session sync failed:", error);
    setAdminMode(false);
    return false;
  }
}

async function requestAdminSession(password) {
  try {
    const res = await fetch("/api/admin/session", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      return false;
    }

    const data = await res.json();
    const authenticated = Boolean(data.authenticated);

    if (authenticated) {
      setAdminMode(true);
    }

    return authenticated;
  } catch (error) {
    console.warn("RetroOS admin login failed:", error);
    return false;
  }
}

window.isAdminMode = false;
window.setAdminMode = setAdminMode;
window.syncAdminSessionState = syncAdminSessionState;

document.addEventListener("DOMContentLoaded", () => {
  const passwordInput = document.getElementById("login-password");
  const loginScreen = document.getElementById("login-screen");

  syncAdminSessionState();

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

async function attemptLogin() {
  if (loginRequestInFlight) return;
  loginRequestInFlight = true;

  const loginScreen = document.getElementById("login-screen");
  const passwordInput = document.getElementById("login-password");

  // Simulate processing delay
  if (passwordInput) passwordInput.disabled = true;
  const enteredPassword = passwordInput ? passwordInput.value.trim() : "";

  // Detect the secret Morphy bypass password before any admin handling so the
  // companion can be summoned even on a brand new visit.
  const isMorphyPassword =
    enteredPassword.toLowerCase() === MORPHY_SECRET_PASSWORD;

  if (enteredPassword && !isMorphyPassword) {
    await requestAdminSession(enteredPassword);
  }

  if (passwordInput) {
    passwordInput.value = "";
  }

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

      // Start the background music, unless the Morphy bypass password was used
      // (Morphy logins should not auto-open the music app).
      if (!isMorphyPassword && typeof startBackgroundMusic === "function") {
        startBackgroundMusic();
      }

      // Show welcome window after successful login
      showWelcomeWindow();

      // Secret password: wake Morphy instantly, bypassing the Trash easter egg.
      if (isMorphyPassword && typeof startMorphyFollower === "function") {
        startMorphyFollower();
      }

      loginRequestInFlight = false;
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
