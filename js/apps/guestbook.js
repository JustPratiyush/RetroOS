/**
 * js/apps/guestbook.js — Guestbook app logic.
 * Allows visitors to leave messages. Includes profanity filter.
 * Admin mode enables deletion of entries.
 */

// --- PROFANITY FILTER ---
const BANNED_WORDS = {
  en: [
    "fuck","shit","ass","bitch","damn","crap","dick","bastard","asshole",
    "motherfucker","bullshit","slut","whore","cock","cunt","piss",
    "retard","faggot","nigger","nigga","twat","wanker","douche",
    "jackass","dumbass","shithead","dickhead","fuckface","prick",
    "scumbag","moron","idiot","stupid","stfu","gtfo","wtf","lmao",
    "porn","nude","naked","sex","boob","penis","vagina","dildo",
    "anus","orgasm","erection","horny","kinky","fetish","hentai"
  ],
  hi: [
    "bhenchod","madarchod","chutiya","gaand","gandu","lund","bhosdike",
    "randi","harami","sala","saala","kutta","kutiya","bhadwa","bhadwe",
    "chut","laude","laudu","jhatu","jhantu","ullu","bakchod","bakchodi",
    "tatti","chodu","chodna","behenchod","mc","bc","bsdk","lodu",
    "chutiyapa","kamina","kameena","kameeni","haramkhor","haramzada"
  ]
};

// Build regex from banned words (case-insensitive, word boundaries)
const _allBanned = [...BANNED_WORDS.en, ...BANNED_WORDS.hi];
const _bannedRegex = new RegExp(
  "\\b(" + _allBanned.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|") + ")\\b",
  "gi"
);

/**
 * Checks if text contains banned words.
 * @param {string} text
 * @returns {boolean}
 */
function containsProfanity(text) {
  _bannedRegex.lastIndex = 0;
  return _bannedRegex.test(text);
}

/**
 * Replaces banned words with asterisks.
 * @param {string} text
 * @returns {string}
 */
function filterProfanity(text) {
  _bannedRegex.lastIndex = 0;
  return text.replace(_bannedRegex, (match) => "*".repeat(match.length));
}

// --- API SERVICE ---
const GuestbookService = {
  _baseUrl() {
    return "";
  },

  async getEntries() {
    try {
      const res = await fetch(`${this._baseUrl()}/api/guestbook`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      return data.entries || [];
    } catch (e) {
      console.error("GuestbookService.getEntries:", e);
      return [];
    }
  },

  async addEntry(name, message) {
    try {
      const res = await fetch(`${this._baseUrl()}/api/guestbook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message }),
      });
      const data = await res.json();
      return data;
    } catch (e) {
      console.error("GuestbookService.addEntry:", e);
      return { success: false, error: e.message };
    }
  },

  async deleteEntry(id) {
    try {
      const res = await fetch(`${this._baseUrl()}/api/guestbook?id=${id}`, {
        method: "DELETE",
        headers: { "X-Admin-Key": window.adminPassword || "" },
      });
      const data = await res.json();
      return data;
    } catch (e) {
      console.error("GuestbookService.deleteEntry:", e);
      return { success: false, error: e.message };
    }
  },
};

// --- STATE ---
let _guestbookEntries = [];
let _selectedEntryId = null;

// --- VIEW TOGGLING ---
function showGbListView() {
  document.getElementById("gb-view-list").style.display = "flex";
  document.getElementById("gb-view-detail").style.display = "none";
  document.getElementById("gb-view-compose").style.display = "none";
  _selectedEntryId = null;
}

function showGbDetailView() {
  document.getElementById("gb-view-list").style.display = "none";
  document.getElementById("gb-view-detail").style.display = "flex";
  document.getElementById("gb-view-compose").style.display = "none";
}

function showGbComposeView() {
  document.getElementById("gb-view-list").style.display = "none";
  document.getElementById("gb-view-detail").style.display = "none";
  document.getElementById("gb-view-compose").style.display = "flex";
  document.getElementById("gb-name-input").value = "";
  document.getElementById("gb-message-input").value = "";
  const warningEl = document.getElementById("gb-warning");
  if (warningEl) warningEl.textContent = "";
}

// --- RENDERING ---
function renderGuestbook() {
  const listEl = document.getElementById("guestbook-list");
  if (listEl) {
    listEl.innerHTML = `<div class="retro-loader">Loading Guestbook</div>`;
  }
  
  GuestbookService.getEntries().then((entries) => {
    _guestbookEntries = entries;
    renderGuestbookList();
    
    // If selected entry was deleted, clear detail and go back to list
    if (_selectedEntryId && !entries.find((e) => e.id === _selectedEntryId)) {
      showGbListView();
    } else if (_selectedEntryId) {
      renderGuestbookDetail();
    }
  });
}

function renderGuestbookList() {
  const listEl = document.getElementById("guestbook-list");
  if (!listEl) return;

  if (_guestbookEntries.length === 0) {
    listEl.innerHTML = `<div class="guestbook-empty">No messages yet. Be the first to leave one!</div>`;
    return;
  }

  listEl.innerHTML = _guestbookEntries
    .map(
      (entry) => `
    <div class="guestbook-list-item" onclick="selectGuestbookEntry('${entry.id}')">
      <span class="gb-name">${escapeHtml(entry.name)}</span>
      <span class="gb-preview">${escapeHtml(entry.message.substring(0, 60))}</span>
      <span class="gb-date">${formatGbDate(entry.timestamp)}</span>
    </div>`
    )
    .join("");
}

function renderGuestbookDetail() {
  const detailBody = document.getElementById("guestbook-detail-body");
  if (!detailBody) return;

  if (!_selectedEntryId) return;

  const entry = _guestbookEntries.find((e) => e.id === _selectedEntryId);
  if (!entry) {
    detailBody.innerHTML = `<div class="guestbook-empty">Message not found</div>`;
    return;
  }

  const deleteBtn = window.isAdminMode
    ? `<button class="gb-btn gb-btn-delete" onclick="deleteGuestbookEntry('${entry.id}')">🗑️ Delete</button>`
    : "";

  detailBody.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:15px;">
      <div>
        <strong style="font-size:24px; display:block;">${escapeHtml(entry.name)}</strong>
        <div class="gb-detail-meta" style="margin-top: 5px;">${formatGbDate(entry.timestamp)}</div>
      </div>
      ${deleteBtn}
    </div>
    <div style="white-space:pre-wrap;">${escapeHtml(entry.message)}</div>
  `;
}

function selectGuestbookEntry(id) {
  _selectedEntryId = id;
  renderGuestbookDetail();
  showGbDetailView();
}

// --- SUBMIT ---
function submitGuestbookEntry() {
  const nameInput = document.getElementById("gb-name-input");
  const msgInput = document.getElementById("gb-message-input");
  const warningEl = document.getElementById("gb-warning");
  if (!nameInput || !msgInput) return;

  const name = nameInput.value.trim();
  const message = msgInput.value.trim();

  if (!name || !message) {
    showGbWarning("Please enter both your name and a message.");
    return;
  }

  if (name.length > 50) {
    showGbWarning("Name must be 50 characters or less.");
    return;
  }

  if (message.length > 500) {
    showGbWarning("Message must be 500 characters or less.");
    return;
  }

  // Profanity check
  if (containsProfanity(name) || containsProfanity(message)) {
    showGbWarning("Your message contains inappropriate language. Please revise it.");
    return;
  }

  // Clear warning
  if (warningEl) warningEl.textContent = "";

  // Filter just in case (belt + suspenders)
  const filteredName = filterProfanity(name);
  const filteredMessage = filterProfanity(message);

  GuestbookService.addEntry(filteredName, filteredMessage).then((result) => {
    if (result.success) {
      nameInput.value = "";
      msgInput.value = "";
      showGbNotification("Message posted! ✨", "success");
      renderGuestbook();
    } else {
      showGbNotification(result.error || "Failed to post message.", "error");
    }
  });
}

// --- DELETE (Admin) ---
function deleteGuestbookEntry(id) {
  if (!window.isAdminMode) return;
  if (!confirm("Delete this guestbook entry?")) return;

  GuestbookService.deleteEntry(id).then((result) => {
    if (result.success) {
      if (_selectedEntryId === id) _selectedEntryId = null;
      showGbNotification("Entry deleted.", "success");
      renderGuestbook();
    } else {
      showGbNotification(result.error || "Failed to delete.", "error");
    }
  });
}

// --- HELPERS ---
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatGbDate(timestamp) {
  if (!timestamp) return "";
  const d = new Date(timestamp);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function showGbWarning(msg) {
  const el = document.getElementById("gb-warning");
  if (el) el.textContent = msg;
}

function showGbNotification(msg, type) {
  const existing = document.querySelector(".gb-notification");
  if (existing) existing.remove();

  const el = document.createElement("div");
  el.className = `gb-notification ${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}
