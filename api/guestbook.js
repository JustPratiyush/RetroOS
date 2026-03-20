import { getRedis } from "./_lib/redis.js";
import {
  applyCors,
  enforceRateLimit,
  enforceTrustedWriteRequest,
  rejectDisallowedOrigin,
  requireAdminSession,
} from "./_lib/security.js";

const GUESTBOOK_KEY = "retroos:guestbook";
const ENTRY_ID_PATTERN = /^gb_\d{13}_[a-z0-9]{6}$/i;
const MAX_NAME_LENGTH = 50;
const MAX_MESSAGE_LENGTH = 500;

// Simple profanity check (server-side double check)
const BANNED = [
  "fuck","shit","bitch","bastard","asshole","motherfucker","slut","whore",
  "cunt","nigger","nigga","faggot","retard","bhenchod","madarchod","chutiya",
  "gaand","gandu","lund","bhosdike","randi","harami","chut","laude","bc","mc","bsdk"
];
const bannedRegex = new RegExp("\\b(" + BANNED.join("|") + ")\\b", "gi");

function containsBanned(text) {
  bannedRegex.lastIndex = 0;
  return bannedRegex.test(text);
}

function filterBanned(text) {
  bannedRegex.lastIndex = 0;
  return text.replace(bannedRegex, (m) => "*".repeat(m.length));
}

export default async function handler(req, res) {
  applyCors(req, res, {
    methods: ["GET", "OPTIONS", "POST", "DELETE"],
    headers: ["Content-Type"],
  });

  if (req.method === "OPTIONS") {
    if (rejectDisallowedOrigin(req, res)) return;
    return res.status(204).end();
  }

  try {
    // GET — return all entries
    if (req.method === "GET") {
      if (rejectDisallowedOrigin(req, res)) return;

      const redis = getRedis({ readOnly: true });
      const entries = await redis.hgetall(GUESTBOOK_KEY) || {};
      const list = Object.values(entries)
        .map(e => typeof e === 'string' ? JSON.parse(e) : e)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      return res.status(200).json({ success: true, entries: list });
    }

    // POST — add entry
    if (req.method === "POST") {
      if (rejectDisallowedOrigin(req, res)) return;
      if (!enforceTrustedWriteRequest(req, res)) return;
      if (
        !enforceRateLimit(req, res, {
          bucket: "guestbook-submit",
          max: 5,
          windowMs: 10 * 60 * 1000,
          errorMessage: "Too many guestbook submissions. Please wait a few minutes.",
        })
      ) {
        return;
      }

      const body = req.body && typeof req.body === "object" ? req.body : {};
      const name = typeof body.name === "string" ? body.name.trim() : "";
      const message = typeof body.message === "string" ? body.message.trim() : "";

      if (!name || !message) {
        return res.status(400).json({ success: false, error: "Name and message are required." });
      }
      if (name.length > MAX_NAME_LENGTH || message.length > MAX_MESSAGE_LENGTH) {
        return res.status(400).json({
          success: false,
          error: `Name (${MAX_NAME_LENGTH}) or message (${MAX_MESSAGE_LENGTH}) too long.`,
        });
      }
      if (containsBanned(name) || containsBanned(message)) {
        return res.status(400).json({ success: false, error: "Message contains inappropriate content." });
      }

      const redis = getRedis();
      const id = `gb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const entry = {
        id,
        name: filterBanned(name),
        message: filterBanned(message),
        timestamp: new Date().toISOString(),
      };

      await redis.hset(GUESTBOOK_KEY, { [id]: JSON.stringify(entry) });
      return res.status(201).json({ success: true, entry });
    }

    // DELETE — admin only
    if (req.method === "DELETE") {
      if (rejectDisallowedOrigin(req, res)) return;
      if (!enforceTrustedWriteRequest(req, res)) return;
      if (
        !enforceRateLimit(req, res, {
          bucket: "guestbook-admin",
          max: 30,
          windowMs: 15 * 60 * 1000,
          errorMessage: "Too many admin actions. Please slow down.",
        })
      ) {
        return;
      }
      if (!requireAdminSession(req, res)) return;

      const id = String(req.query?.id || "");
      if (!ENTRY_ID_PATTERN.test(id)) {
        return res.status(400).json({ success: false, error: "Entry ID required." });
      }

      const redis = getRedis();
      await redis.hdel(GUESTBOOK_KEY, id);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, error: "Method not allowed." });
  } catch (error) {
    console.error("Guestbook API error:", error);
    return res.status(500).json({ success: false, error: "Internal server error." });
  }
}
