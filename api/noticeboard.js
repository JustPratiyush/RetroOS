import { getRedis } from "./_lib/redis.js";
import {
  applyCors,
  enforceRateLimit,
  enforceTrustedWriteRequest,
  rejectDisallowedOrigin,
  requireAdminSession,
} from "./_lib/security.js";

const NOTICEBOARD_KEY = "retroos:noticeboard";
const NOTICE_ID_PATTERN = /^nb_\d{13}_[a-z0-9]{6}$/i;
const ATTACHMENT_ID_PATTERN = /^att_[a-z0-9]+_[a-z0-9]{6}$/i;
const MAX_TITLE_LENGTH = 120;
const MAX_CONTENT_LENGTH = 4000;
const ALLOWED_TAGS = new Set(["update", "announce", "warning", "info"]);
const ALLOWED_ATTACHMENT_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "text/markdown",
]);
const MAX_ATTACHMENTS = 3;
const MAX_ATTACHMENT_NAME_LENGTH = 80;
const MAX_ATTACHMENT_BYTES = 256 * 1024;
const MAX_TOTAL_ATTACHMENT_BYTES = 640 * 1024;

function normalizeAttachmentName(name) {
  return String(name || "attachment")
    .replace(/[\u0000-\u001f\u007f/\\<>"']+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_ATTACHMENT_NAME_LENGTH) || "attachment";
}

function parseNoticeboardAttachments(rawAttachments) {
  if (rawAttachments === undefined) return [];
  if (!Array.isArray(rawAttachments)) {
    throw new Error("Attachments must be sent as an array.");
  }
  if (rawAttachments.length > MAX_ATTACHMENTS) {
    throw new Error(`No more than ${MAX_ATTACHMENTS} attachments are allowed.`);
  }

  let totalBytes = 0;

  return rawAttachments.map((attachment) => {
    if (!attachment || typeof attachment !== "object") {
      throw new Error("Each attachment must be an object.");
    }

    const id = String(attachment.id || "").trim();
    const name = normalizeAttachmentName(attachment.name);
    const mimeType = String(attachment.mimeType || "").trim().toLowerCase();
    const dataUrl = String(attachment.dataUrl || "").trim();

    if (!ATTACHMENT_ID_PATTERN.test(id)) {
      throw new Error("Attachment ID is invalid.");
    }
    if (!ALLOWED_ATTACHMENT_TYPES.has(mimeType)) {
      throw new Error(`"${name}" is not an allowed attachment type.`);
    }

    const dataUrlMatch = dataUrl.match(/^data:([^;]+);base64,([a-z0-9+/=]+)$/i);
    if (!dataUrlMatch) {
      throw new Error(`"${name}" has an invalid file payload.`);
    }

    const payloadMimeType = dataUrlMatch[1].toLowerCase();
    if (payloadMimeType !== mimeType) {
      throw new Error(`"${name}" has mismatched attachment metadata.`);
    }

    const buffer = Buffer.from(dataUrlMatch[2], "base64");
    if (!buffer.length) {
      throw new Error(`"${name}" is empty.`);
    }
    if (buffer.length > MAX_ATTACHMENT_BYTES) {
      throw new Error(`"${name}" is larger than ${MAX_ATTACHMENT_BYTES} bytes.`);
    }

    totalBytes += buffer.length;
    if (totalBytes > MAX_TOTAL_ATTACHMENT_BYTES) {
      throw new Error(`Total attachment size exceeds ${MAX_TOTAL_ATTACHMENT_BYTES} bytes.`);
    }

    return {
      id,
      name,
      mimeType,
      size: buffer.length,
      dataUrl: `data:${mimeType};base64,${dataUrlMatch[2]}`,
    };
  });
}

function parseNoticeboardAttachmentsSafe(rawAttachments) {
  try {
    return { attachments: parseNoticeboardAttachments(rawAttachments), error: null };
  } catch (error) {
    return {
      attachments: null,
      error: error instanceof Error ? error.message : "Invalid attachments.",
    };
  }
}

export default async function handler(req, res) {
  applyCors(req, res, {
    methods: ["GET", "OPTIONS", "POST", "PUT", "DELETE"],
    headers: ["Content-Type"],
  });

  if (req.method === "OPTIONS") {
    if (rejectDisallowedOrigin(req, res)) return;
    return res.status(204).end();
  }

  try {
    // GET — return all posts
    if (req.method === "GET") {
      if (rejectDisallowedOrigin(req, res)) return;

      const redis = getRedis({ readOnly: true });
      const posts = await redis.hgetall(NOTICEBOARD_KEY) || {};
      const list = Object.values(posts)
        .map(p => typeof p === 'string' ? JSON.parse(p) : p)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      return res.status(200).json({ success: true, posts: list });
    }

    // POST — admin create
    if (req.method === "POST") {
      if (rejectDisallowedOrigin(req, res)) return;
      if (!enforceTrustedWriteRequest(req, res)) return;
      if (
        !enforceRateLimit(req, res, {
          bucket: "noticeboard-admin",
          max: 30,
          windowMs: 15 * 60 * 1000,
          errorMessage: "Too many admin actions. Please slow down.",
        })
      ) {
        return;
      }
      if (!requireAdminSession(req, res)) return;

      const body = req.body && typeof req.body === "object" ? req.body : {};
      const title = typeof body.title === "string" ? body.title.trim() : "";
      const content = typeof body.content === "string" ? body.content.trim() : "";
      const tag = ALLOWED_TAGS.has(body.tag) ? body.tag : "info";
      const { attachments, error } = parseNoticeboardAttachmentsSafe(body.attachments);

      if (!title || !content) {
        return res.status(400).json({ success: false, error: "Title and content are required." });
      }
      if (error) {
        return res.status(400).json({ success: false, error });
      }
      if (title.length > MAX_TITLE_LENGTH || content.length > MAX_CONTENT_LENGTH) {
        return res.status(400).json({
          success: false,
          error: `Title (${MAX_TITLE_LENGTH}) or content (${MAX_CONTENT_LENGTH}) too long.`,
        });
      }

      const redis = getRedis();
      const id = `nb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const post = {
        id,
        title,
        content,
        tag,
        attachments,
        timestamp: new Date().toISOString(),
      };

      await redis.hset(NOTICEBOARD_KEY, { [id]: JSON.stringify(post) });
      return res.status(201).json({ success: true, post });
    }

    // PUT — admin update
    if (req.method === "PUT") {
      if (rejectDisallowedOrigin(req, res)) return;
      if (!enforceTrustedWriteRequest(req, res)) return;
      if (
        !enforceRateLimit(req, res, {
          bucket: "noticeboard-admin",
          max: 30,
          windowMs: 15 * 60 * 1000,
          errorMessage: "Too many admin actions. Please slow down.",
        })
      ) {
        return;
      }
      if (!requireAdminSession(req, res)) return;

      const body = req.body && typeof req.body === "object" ? req.body : {};
      const id = typeof body.id === "string" ? body.id.trim() : "";
      const title = typeof body.title === "string" ? body.title.trim() : "";
      const content = typeof body.content === "string" ? body.content.trim() : "";
      const tag = ALLOWED_TAGS.has(body.tag) ? body.tag : "info";
      const { attachments, error } = parseNoticeboardAttachmentsSafe(body.attachments);

      if (!id || !title || !content) {
        return res.status(400).json({ success: false, error: "ID, title, and content are required." });
      }
      if (error) {
        return res.status(400).json({ success: false, error });
      }
      if (!NOTICE_ID_PATTERN.test(id)) {
        return res.status(400).json({ success: false, error: "Valid notice ID required." });
      }
      if (title.length > MAX_TITLE_LENGTH || content.length > MAX_CONTENT_LENGTH) {
        return res.status(400).json({
          success: false,
          error: `Title (${MAX_TITLE_LENGTH}) or content (${MAX_CONTENT_LENGTH}) too long.`,
        });
      }

      // Get existing to preserve timestamp
      const redis = getRedis();
      const existing = await redis.hget(NOTICEBOARD_KEY, id);
      if (!existing) {
        return res.status(404).json({ success: false, error: "Post not found." });
      }

      const oldPost = typeof existing === 'string' ? JSON.parse(existing) : existing;
      const updated = {
        ...oldPost,
        title,
        content,
        tag,
        attachments,
        updatedAt: new Date().toISOString(),
      };

      await redis.hset(NOTICEBOARD_KEY, { [id]: JSON.stringify(updated) });
      return res.status(200).json({ success: true, post: updated });
    }

    // DELETE — admin only
    if (req.method === "DELETE") {
      if (rejectDisallowedOrigin(req, res)) return;
      if (!enforceTrustedWriteRequest(req, res)) return;
      if (
        !enforceRateLimit(req, res, {
          bucket: "noticeboard-admin",
          max: 30,
          windowMs: 15 * 60 * 1000,
          errorMessage: "Too many admin actions. Please slow down.",
        })
      ) {
        return;
      }
      if (!requireAdminSession(req, res)) return;

      const id = String(req.query?.id || "");
      if (!NOTICE_ID_PATTERN.test(id)) {
        return res.status(400).json({ success: false, error: "Post ID required." });
      }

      const redis = getRedis();
      await redis.hdel(NOTICEBOARD_KEY, id);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, error: "Method not allowed." });
  } catch (error) {
    console.error("Noticeboard API error:", error);
    return res.status(500).json({ success: false, error: "Internal server error." });
  }
}
