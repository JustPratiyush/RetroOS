/**
 * js/apps/noticeboard.js — Notice Board app logic.
 * Displays developer updates/announcements.
 * Admin mode enables creating, editing, and deleting posts.
 */

// --- API SERVICE ---
const NoticeboardService = {
  _baseUrl() {
    return "";
  },

  async getPosts() {
    try {
      const res = await fetch(`${this._baseUrl()}/api/noticeboard`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      return data.posts || [];
    } catch (e) {
      console.error("NoticeboardService.getPosts:", e);
      return [];
    }
  },

  async createPost(title, content, tag) {
    try {
      const res = await fetch(`${this._baseUrl()}/api/noticeboard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Key": window.adminPassword || "",
        },
        body: JSON.stringify({ title, content, tag }),
      });
      return await res.json();
    } catch (e) {
      console.error("NoticeboardService.createPost:", e);
      return { success: false, error: e.message };
    }
  },

  async updatePost(id, title, content, tag) {
    try {
      const res = await fetch(`${this._baseUrl()}/api/noticeboard`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Key": window.adminPassword || "",
        },
        body: JSON.stringify({ id, title, content, tag }),
      });
      return await res.json();
    } catch (e) {
      console.error("NoticeboardService.updatePost:", e);
      return { success: false, error: e.message };
    }
  },

  async deletePost(id) {
    try {
      const res = await fetch(`${this._baseUrl()}/api/noticeboard?id=${id}`, {
        method: "DELETE",
        headers: { "X-Admin-Key": window.adminPassword || "" },
      });
      return await res.json();
    } catch (e) {
      console.error("NoticeboardService.deletePost:", e);
      return { success: false, error: e.message };
    }
  },
};

// --- STATE ---
let _noticeboardPosts = [];
let _nbEditingId = null; // Track which post is being edited

function getNoticeboardLoaderMarkup() {
  return `
    <div class="noticeboard-loader" role="status" aria-live="polite">
      <div class="noticeboard-loader-panel">
        <div class="noticeboard-loader-title">Loading Notices</div>
        <div class="noticeboard-loader-track" aria-hidden="true"></div>
        <div class="noticeboard-loader-copy">
          Syncing the latest developer bulletins...
        </div>
      </div>
    </div>
  `;
}

// --- RENDERING ---
function renderNoticeboard() {
  const container = document.getElementById("noticeboard-posts");
  if (container) {
    container.innerHTML = getNoticeboardLoaderMarkup();
  }
  
  NoticeboardService.getPosts().then((posts) => {
    _noticeboardPosts = posts;
    renderNoticeboardPosts();
  });
}

function renderNoticeboardPosts() {
  const container = document.getElementById("noticeboard-posts");
  if (!container) return;

  if (_noticeboardPosts.length === 0) {
    container.innerHTML = `<div class="noticeboard-empty">No notices posted yet.</div>`;
    return;
  }

  container.innerHTML = _noticeboardPosts
    .map((post) => {
      const tagHtml = post.tag
        ? `<span class="nb-tag nb-tag-${post.tag}">${formatTagLabel(post.tag)}</span>`
        : "";

      const adminBtns = `
        <div class="nb-card-actions admin-only">
          <button class="nb-btn nb-btn-small" onclick="editNoticeboardPost('${post.id}')" title="Edit">✏️</button>
          <button class="nb-btn nb-btn-small nb-btn-delete" onclick="deleteNoticeboardPost('${post.id}')" title="Delete">🗑️</button>
        </div>`;

      return `
        <div class="nb-card" id="nb-card-${post.id}">
          <div class="nb-card-header">
            <div>
              ${tagHtml}
              <div class="nb-card-title">${escapeNbHtml(post.title)}</div>
              <div class="nb-card-date">${formatNbDate(post.timestamp)}</div>
            </div>
            ${adminBtns}
          </div>
          <div class="nb-card-body">${escapeNbHtml(post.content)}</div>
        </div>`;
    })
    .join("");
}

// --- ADMIN: CREATE ---
function showNbComposeForm() {
  _nbEditingId = null;
  const form = document.getElementById("nb-compose-form");
  if (!form) return;
  form.style.display = "block";
  document.getElementById("nb-compose-title").value = "";
  document.getElementById("nb-compose-content").value = "";
  document.getElementById("nb-compose-tag").value = "update";
  document.getElementById("nb-compose-submit-text").textContent = "Post Notice";
}

function hideNbComposeForm() {
  const form = document.getElementById("nb-compose-form");
  if (form) form.style.display = "none";
  _nbEditingId = null;
}

function submitNoticeboardPost() {
  const title = document.getElementById("nb-compose-title")?.value.trim();
  const content = document.getElementById("nb-compose-content")?.value.trim();
  const tag = document.getElementById("nb-compose-tag")?.value || "info";

  if (!title || !content) {
    showNbNotification("Please enter both title and content.", "error");
    return;
  }

  if (_nbEditingId) {
    // Update existing
    NoticeboardService.updatePost(_nbEditingId, title, content, tag).then((result) => {
      if (result.success) {
        hideNbComposeForm();
        showNbNotification("Notice updated!", "success");
        renderNoticeboard();
      } else {
        showNbNotification(result.error || "Failed to update.", "error");
      }
    });
  } else {
    // Create new
    NoticeboardService.createPost(title, content, tag).then((result) => {
      if (result.success) {
        hideNbComposeForm();
        showNbNotification("Notice posted!", "success");
        renderNoticeboard();
      } else {
        showNbNotification(result.error || "Failed to post.", "error");
      }
    });
  }
}

// --- ADMIN: EDIT ---
function editNoticeboardPost(id) {
  const post = _noticeboardPosts.find((p) => p.id === id);
  if (!post) return;

  _nbEditingId = id;
  const form = document.getElementById("nb-compose-form");
  if (!form) return;
  form.style.display = "block";
  document.getElementById("nb-compose-title").value = post.title;
  document.getElementById("nb-compose-content").value = post.content;
  document.getElementById("nb-compose-tag").value = post.tag || "info";
  document.getElementById("nb-compose-submit-text").textContent = "Update Notice";
}

// --- ADMIN: DELETE ---
function deleteNoticeboardPost(id) {
  if (!window.isAdminMode) return;
  if (!confirm("Delete this notice?")) return;

  NoticeboardService.deletePost(id).then((result) => {
    if (result.success) {
      showNbNotification("Notice deleted.", "success");
      renderNoticeboard();
    } else {
      showNbNotification(result.error || "Failed to delete.", "error");
    }
  });
}

// --- HELPERS ---
function escapeNbHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function formatNbDate(timestamp) {
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

function formatTagLabel(tag) {
  const labels = {
    update: "📦 Update",
    announce: "📢 Announcement",
    warning: "⚠️ Warning",
    info: "ℹ️ Info",
  };
  return labels[tag] || tag;
}

function showNbNotification(msg, type) {
  // Reuse same pattern as guestbook
  const existing = document.querySelector(".gb-notification");
  if (existing) existing.remove();

  const el = document.createElement("div");
  el.className = `gb-notification ${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}
