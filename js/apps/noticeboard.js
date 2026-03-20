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

  async createPost(title, content, tag, attachments) {
    try {
      const res = await fetch(`${this._baseUrl()}/api/noticeboard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ title, content, tag, attachments }),
      });
      const data = await res.json();
      if (res.status === 401 && typeof window.setAdminMode === "function") {
        window.setAdminMode(false);
      }
      return data;
    } catch (e) {
      console.error("NoticeboardService.createPost:", e);
      return { success: false, error: e.message };
    }
  },

  async updatePost(id, title, content, tag, attachments) {
    try {
      const res = await fetch(`${this._baseUrl()}/api/noticeboard`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ id, title, content, tag, attachments }),
      });
      const data = await res.json();
      if (res.status === 401 && typeof window.setAdminMode === "function") {
        window.setAdminMode(false);
      }
      return data;
    } catch (e) {
      console.error("NoticeboardService.updatePost:", e);
      return { success: false, error: e.message };
    }
  },

  async deletePost(id) {
    try {
      const res = await fetch(`${this._baseUrl()}/api/noticeboard?id=${id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = await res.json();
      if (res.status === 401 && typeof window.setAdminMode === "function") {
        window.setAdminMode(false);
      }
      return data;
    } catch (e) {
      console.error("NoticeboardService.deletePost:", e);
      return { success: false, error: e.message };
    }
  },
};

// --- STATE ---
let _noticeboardPosts = [];
let _nbEditingId = null; // Track which post is being edited
let _nbDraftAttachments = [];
let _nbExpandedAttachmentPosts = new Set();

const NB_ALLOWED_ATTACHMENT_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "text/markdown",
]);
const NB_IMAGE_ATTACHMENT_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);
const NB_TEXT_ATTACHMENT_TYPES = new Set([
  "text/plain",
  "text/markdown",
]);
const NB_MAX_ATTACHMENTS = 3;
const NB_MAX_ATTACHMENT_BYTES = 256 * 1024;
const NB_MAX_TOTAL_ATTACHMENT_BYTES = 640 * 1024;

document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("nb-compose-files");
  if (fileInput) {
    fileInput.addEventListener("change", handleNoticeboardFileSelection);
  }
});

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
      const attachmentToggleHtml = renderNoticeboardAttachmentToggle(post);
      const attachmentsHtml = renderNoticeboardAttachments(post);
      const hasAttachments = Array.isArray(post.attachments) && post.attachments.length > 0;

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
          <div class="nb-card-body-wrap">
            <div class="nb-card-body${hasAttachments ? " nb-card-body-has-attachment" : ""}">${escapeNbHtml(post.content)}</div>
            ${attachmentToggleHtml}
          </div>
          ${attachmentsHtml}
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
  resetNoticeboardDraftAttachments();
}

function hideNbComposeForm() {
  const form = document.getElementById("nb-compose-form");
  if (form) form.style.display = "none";
  _nbEditingId = null;
  resetNoticeboardDraftAttachments();
}

async function submitNoticeboardPost() {
  const title = document.getElementById("nb-compose-title")?.value.trim();
  const content = document.getElementById("nb-compose-content")?.value.trim();
  const tag = document.getElementById("nb-compose-tag")?.value || "info";

  if (!title || !content) {
    showNbNotification("Please enter both title and content.", "error");
    return;
  }

  const attachments = _nbDraftAttachments.map(serializeNoticeboardAttachment);

  if (_nbEditingId) {
    // Update existing
    NoticeboardService.updatePost(_nbEditingId, title, content, tag, attachments).then((result) => {
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
    NoticeboardService.createPost(title, content, tag, attachments).then((result) => {
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
  _nbDraftAttachments = (post.attachments || []).map((attachment) => ({
    id: attachment.id,
    name: attachment.name,
    mimeType: attachment.mimeType,
    size: attachment.size,
    dataUrl: attachment.dataUrl,
  }));
  renderNoticeboardDraftAttachments();
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

function escapeNbAttribute(text) {
  return escapeNbHtml(text).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function renderNoticeboardAttachments(post) {
  const attachments = Array.isArray(post.attachments) ? post.attachments : [];
  if (!attachments.length) return "";
  if (!_nbExpandedAttachmentPosts.has(post.id)) return "";

  const cards = attachments
    .map((attachment) => {
      const isImage = NB_IMAGE_ATTACHMENT_TYPES.has(attachment.mimeType);
      const thumb = isImage
        ? `<img src="${attachment.dataUrl}" alt="${escapeNbAttribute(attachment.name)}" loading="lazy" />`
        : `<span>${getNoticeboardAttachmentGlyph(attachment.mimeType)}</span>`;

      return `
        <div class="nb-attachment-card">
          <div class="nb-attachment-thumb">${thumb}</div>
          <div class="nb-attachment-meta">
            <div class="nb-attachment-name">${escapeNbHtml(attachment.name)}</div>
            <div class="nb-attachment-size">${formatNoticeboardBytes(attachment.size)}</div>
            <div class="nb-attachment-actions">
              <button class="nb-attachment-btn" onclick="openNoticeboardAttachment('${post.id}', '${attachment.id}')">Open</button>
              <button class="nb-attachment-btn" onclick="downloadNoticeboardAttachment('${post.id}', '${attachment.id}')">Save</button>
            </div>
          </div>
        </div>`;
    })
    .join("");

  return `
    <div class="nb-card-attachments">
      <div class="nb-card-attachments-title">Attachment Preview</div>
      <div class="nb-attachment-grid">${cards}</div>
    </div>`;
}

function renderNoticeboardAttachmentToggle(post) {
  const attachments = Array.isArray(post.attachments) ? post.attachments : [];
  if (!attachments.length) return "";

  const firstAttachment = attachments[0];
  const isExpanded = _nbExpandedAttachmentPosts.has(post.id);
  const badgePreview = NB_IMAGE_ATTACHMENT_TYPES.has(firstAttachment.mimeType)
    ? `<img src="${firstAttachment.dataUrl}" alt="" aria-hidden="true" />`
    : `<span>${getNoticeboardAttachmentGlyph(firstAttachment.mimeType)}</span>`;

  return `
    <button
      class="nb-attachment-toggle${isExpanded ? " is-open" : ""}"
      onclick="toggleNoticeboardAttachments('${post.id}')"
      title="${attachments.length} attachment${attachments.length === 1 ? "" : "s"}"
      aria-label="Toggle attachments"
    >
      <span class="nb-attachment-toggle-preview">${badgePreview}</span>
      <span class="nb-attachment-toggle-count">${attachments.length}</span>
    </button>`;
}

function renderNoticeboardDraftAttachments() {
  const container = document.getElementById("nb-compose-attachments");
  if (!container) return;

  if (!_nbDraftAttachments.length) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = _nbDraftAttachments
    .map(
      (attachment) => `
        <div class="nb-compose-attachment">
          <div class="nb-compose-attachment-copy">
            <div class="nb-compose-attachment-name">${escapeNbHtml(attachment.name)}</div>
            <div class="nb-compose-attachment-meta">${escapeNbHtml(getNoticeboardAttachmentTypeLabel(attachment.mimeType))} • ${formatNoticeboardBytes(attachment.size)}</div>
          </div>
          <button class="nb-compose-attachment-remove" onclick="removeNoticeboardAttachment('${attachment.id}')">Remove</button>
        </div>`
    )
    .join("");
}

function resetNoticeboardDraftAttachments() {
  _nbDraftAttachments = [];
  const fileInput = document.getElementById("nb-compose-files");
  if (fileInput) fileInput.value = "";
  renderNoticeboardDraftAttachments();
}

async function handleNoticeboardFileSelection(event) {
  const fileInput = event?.target;
  const selectedFiles = Array.from(fileInput?.files || []);
  if (!selectedFiles.length) return;

  try {
    const nextAttachments = [..._nbDraftAttachments];

    for (const file of selectedFiles) {
      if (nextAttachments.length >= NB_MAX_ATTACHMENTS) {
        showNbNotification(`Only ${NB_MAX_ATTACHMENTS} attachments are allowed per notice.`, "error");
        break;
      }

      const normalizedMimeType = normalizeNoticeboardFileType(file);
      if (!NB_ALLOWED_ATTACHMENT_TYPES.has(normalizedMimeType)) {
        showNbNotification(`"${file.name}" is not a supported file type.`, "error");
        continue;
      }

      if (file.size > NB_MAX_ATTACHMENT_BYTES) {
        showNbNotification(`"${file.name}" is larger than ${formatNoticeboardBytes(NB_MAX_ATTACHMENT_BYTES)}.`, "error");
        continue;
      }

      const projectedTotal = getNoticeboardAttachmentTotalBytes(nextAttachments) + file.size;
      if (projectedTotal > NB_MAX_TOTAL_ATTACHMENT_BYTES) {
        showNbNotification(`Attachments together must stay under ${formatNoticeboardBytes(NB_MAX_TOTAL_ATTACHMENT_BYTES)}.`, "error");
        continue;
      }

      const dataUrl = await readNoticeboardFileAsDataUrl(file);
      nextAttachments.push({
        id: createNoticeboardAttachmentId(),
        name: normalizeNoticeboardFileName(file.name),
        mimeType: normalizedMimeType,
        size: file.size,
        dataUrl,
      });
    }

    _nbDraftAttachments = nextAttachments;
    renderNoticeboardDraftAttachments();
  } catch (error) {
    console.error("Noticeboard attachment read failed:", error);
    showNbNotification("Failed to read one of the selected files.", "error");
  } finally {
    if (fileInput) fileInput.value = "";
  }
}

function removeNoticeboardAttachment(attachmentId) {
  _nbDraftAttachments = _nbDraftAttachments.filter((attachment) => attachment.id !== attachmentId);
  renderNoticeboardDraftAttachments();
}

function toggleNoticeboardAttachments(postId) {
  if (_nbExpandedAttachmentPosts.has(postId)) {
    _nbExpandedAttachmentPosts.delete(postId);
  } else {
    _nbExpandedAttachmentPosts.add(postId);
  }

  renderNoticeboardPosts();
}

function openNoticeboardAttachment(postId, attachmentId) {
  const attachment = findNoticeboardAttachment(postId, attachmentId);
  if (!attachment) return;

  if (NB_IMAGE_ATTACHMENT_TYPES.has(attachment.mimeType)) {
    if (typeof openPhotoViewer === "function") {
      openPhotoViewer(attachment.dataUrl, attachment.name);
      return;
    }
  }

  if (NB_TEXT_ATTACHMENT_TYPES.has(attachment.mimeType) || attachment.mimeType === "application/pdf") {
    window.open(attachment.dataUrl, "_blank", "noopener,noreferrer");
    return;
  }

  triggerNoticeboardAttachmentDownload(attachment);
}

function downloadNoticeboardAttachment(postId, attachmentId) {
  const attachment = findNoticeboardAttachment(postId, attachmentId);
  if (!attachment) return;
  triggerNoticeboardAttachmentDownload(attachment);
}

function findNoticeboardAttachment(postId, attachmentId) {
  const post = _noticeboardPosts.find((item) => item.id === postId);
  if (!post || !Array.isArray(post.attachments)) return null;
  return post.attachments.find((attachment) => attachment.id === attachmentId) || null;
}

function triggerNoticeboardAttachmentDownload(attachment) {
  const link = document.createElement("a");
  link.href = attachment.dataUrl;
  link.download = attachment.name;
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function serializeNoticeboardAttachment(attachment) {
  return {
    id: attachment.id,
    name: attachment.name,
    mimeType: attachment.mimeType,
    size: attachment.size,
    dataUrl: attachment.dataUrl,
  };
}

function createNoticeboardAttachmentId() {
  return `att_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeNoticeboardFileName(name) {
  return String(name || "attachment")
    .replace(/[\u0000-\u001f\u007f/\\<>"']+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80) || "attachment";
}

function normalizeNoticeboardFileType(file) {
  const explicitType = String(file.type || "").toLowerCase();
  if (NB_ALLOWED_ATTACHMENT_TYPES.has(explicitType)) return explicitType;

  const name = String(file.name || "").toLowerCase();
  if (name.endsWith(".md")) return "text/markdown";
  if (name.endsWith(".txt")) return "text/plain";
  if (name.endsWith(".pdf")) return "application/pdf";
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".webp")) return "image/webp";
  if (name.endsWith(".gif")) return "image/gif";
  return explicitType;
}

function readNoticeboardFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("File read failed."));
    reader.readAsDataURL(file);
  });
}

function getNoticeboardAttachmentTotalBytes(attachments) {
  return attachments.reduce((total, attachment) => total + Number(attachment.size || 0), 0);
}

function getNoticeboardAttachmentTypeLabel(mimeType) {
  const labels = {
    "image/png": "PNG image",
    "image/jpeg": "JPEG image",
    "image/webp": "WEBP image",
    "image/gif": "GIF image",
    "application/pdf": "PDF document",
    "text/plain": "Text file",
    "text/markdown": "Markdown file",
  };
  return labels[mimeType] || "File";
}

function getNoticeboardAttachmentGlyph(mimeType) {
  if (mimeType === "application/pdf") return "📄";
  if (NB_TEXT_ATTACHMENT_TYPES.has(mimeType)) return "📝";
  return "📎";
}

function formatNoticeboardBytes(bytes) {
  const value = Number(bytes || 0);
  if (value >= 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (value >= 1024) {
    return `${Math.max(1, Math.round(value / 1024))} KB`;
  }
  return `${value} B`;
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
