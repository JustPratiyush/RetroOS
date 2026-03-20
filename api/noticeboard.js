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
const MAX_TITLE_LENGTH = 120;
const MAX_CONTENT_LENGTH = 4000;
const ALLOWED_TAGS = new Set(["update", "announce", "warning", "info"]);

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

      if (!title || !content) {
        return res.status(400).json({ success: false, error: "Title and content are required." });
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

      if (!id || !title || !content) {
        return res.status(400).json({ success: false, error: "ID, title, and content are required." });
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
