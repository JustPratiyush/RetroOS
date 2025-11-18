/**
 * App: Date/Time, Battery, and Wi-Fi Popovers
 * Handles all logic for the status bar icons and their detailed pop-up windows.
 */

// --- 1. CLOCK / DATE/TIME LOGIC ---

function updateClockContent(forceUpdate = false) {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");

  const clockEl = document.getElementById("clock");
  if (clockEl) clockEl.textContent = `${h}:${m}`;

  const clockApp = document.getElementById("clockApp");
  if (clockApp && (forceUpdate || clockApp.style.display === "block")) {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const clockContent = `
      <div style="text-align: center; padding: 15px; font-family: 'VT323', monospace;">
        <div style="font-size: 36px; margin-bottom: 5px;">${h}:${m}</div>
        <div style="font-size: 16px; margin-bottom: 10px;">
          ${now.toLocaleDateString(undefined, { weekday: "long" })}, 
          ${now.toLocaleDateString(undefined, {
            month: "long",
          })} ${now.getDate()}, ${now.getFullYear()}
        </div>
        <div style="font-size: 14px; color: #666;">
          ${timeZone.replace(/_/g, " ")}
        </div>
      </div>
    `;

    const contentEl = document.querySelector("#clockApp .content");
    if (contentEl) contentEl.innerHTML = clockContent;
  }
}

function initClock() {
  updateClockContent();
  // Update clock display every minute (60000ms)
  setInterval(() => {
    updateClockContent();
  }, 60000);
}
// --- 2. BATTERY LOGIC ---

/**
 * Updates the content of the Battery popover window.
 */
function updateBatteryContent() {
  const batteryContentEl = document.getElementById("batteryContent");
  if (!batteryContentEl) return;

  if (!("getBattery" in navigator)) {
    batteryContentEl.innerHTML = `
      <div style="font-family: 'VT323', monospace; padding: 10px;">
        <p>Battery status not supported by your browser.</p>
      </div>
    `;
    return;
  }

  navigator.getBattery().then(function (battery) {
    const levelPercent = Math.round(battery.level * 100);
    const chargingStatus = battery.charging ? "Charging" : "On Battery Power";
    const statusColor = battery.charging
      ? "#32cd32"
      : levelPercent < 20
      ? "#ff6b6b"
      : "#333";

    let statusDetails = "";
    if (battery.chargingTime === Infinity) {
      statusDetails = "Fully charged or time unknown.";
    } else if (battery.chargingTime > 0) {
      const minutes = Math.ceil(battery.chargingTime / 60);
      statusDetails = `Time to fully charge: ${minutes} minutes`;
    } else if (battery.dischargingTime !== Infinity) {
      const minutes = Math.ceil(battery.dischargingTime / 60);
      statusDetails = `Remaining time: ${minutes} minutes`;
    } else {
      statusDetails = "Remaining time unknown.";
    }

    batteryContentEl.innerHTML = `
      <div style="font-family: 'VT323', monospace; padding: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <strong style="font-size: 18px;">Level:</strong>
          <span style="font-size: 18px; color: ${statusColor};">${levelPercent}%</span>
        </div>
        <div style="height: 10px; background: #ccc; border-radius: 5px; margin-bottom: 15px;">
          <div style="height: 10px; width: ${levelPercent}%; background: ${statusColor}; border-radius: 5px;"></div>
        </div>
        <p style="margin-bottom: 5px; color: ${statusColor};">Status: ${chargingStatus}</p>
        <p style="font-size: 14px; color: #666;">${statusDetails}</p>
        <div style="border-top: 1px solid #ddd; margin-top: 10px; padding-top: 10px;">
            <p style="font-size: 12px; color: #888;">Note: Time estimates are highly variable.</p>
        </div>
      </div>
    `;
  });
}

// --- 3. WI-FI LOGIC ---

/**
 * Updates the content of the Wi-Fi popover window.
 */
function updateWifiContent() {
  const wifiContentEl = document.getElementById("wifiContent");
  if (!wifiContentEl) return;

  // Note: We cannot get actual Wi-Fi network data in a browser environment
  // for security reasons, so we mock the status.

  const isConnected = navigator.onLine;
  const connectionType = navigator.connection?.effectiveType || "wifi"; // Mocked type
  const connectionSpeed = navigator.connection?.downlink || 10; // Mocked speed

  wifiContentEl.innerHTML = `
    <div style="font-family: 'VT323', monospace;">
      <div style="border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px;">
        <strong style="font-size: 16px; color: ${
          isConnected ? "#32cd32" : "#ff6b6b"
        };">
          ${isConnected ? "Wi-Fi: On" : "Wi-Fi: Off"}
        </strong>
      </div>
      
      <div style="margin-bottom: 10px; padding: 5px; background: #fff; border: 1px solid #ddd; border-radius: 3px;">
        <p style="font-weight: bold; margin-bottom: 3px;">RetroOS Network (Simulated)</p>
        <p style="font-size: 14px; color: #666;">
          Signal: Full
          <span style="float: right;">Status: Connected</span>
        </p>
      </div>

      <p style="font-size: 14px;">Connection Type: ${connectionType.toUpperCase()}</p>
      <p style="font-size: 14px;">Speed: ${connectionSpeed} Mbps (Simulated)</p>
      
      <div style="border-top: 1px solid #ccc; margin-top: 10px; padding-top: 10px;">
        <button onclick="createMessageWindow('Network Settings', 'Network settings are currently read-only in this demo.')" 
          style="width: 100%; padding: 5px; background: #eee; border: 1px solid #ccc; cursor: pointer;">
          Network Preferences...
        </button>
      </div>
    </div>
  `;
}

/**
 * Initializes all status update loops.
 */
function initStatusApps() {
  // Start the clock and its update interval
  initClock();

  // Set up continuous content updates for battery (already handled in system.js
  // but this ensures the popover updates if open).
  if ("getBattery" in navigator) {
    navigator.getBattery().then(function (battery) {
      battery.addEventListener("levelchange", () => {
        if (windowStates["batteryApp"] === "open") updateBatteryContent();
      });
      battery.addEventListener("chargingchange", () => {
        if (windowStates["batteryApp"] === "open") updateBatteryContent();
      });
    });
  }

  // Set up an interval for Wi-Fi content (since it's mostly mocked)
  setInterval(() => {
    if (windowStates["wifiApp"] === "open") updateWifiContent();
  }, 5000);
}

// Call the initialization function when loaded
// This runs the clock and sets up listeners for battery/wifi updates
initStatusApps();
