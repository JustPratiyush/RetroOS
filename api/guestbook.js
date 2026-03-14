import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

const ADMIN_PASSWORD = process.env.ADMIN_SECRET_KEY || "RetroAdmin$123";
const GUESTBOOK_KEY = "retroos:guestbook";

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
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Key');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // GET — return all entries
    if (req.method === 'GET') {
      const entries = await redis.hgetall(GUESTBOOK_KEY) || {};
      const list = Object.values(entries)
        .map(e => typeof e === 'string' ? JSON.parse(e) : e)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      return res.status(200).json({ success: true, entries: list });
    }

    // POST — add entry
    if (req.method === 'POST') {
      const { name, message } = req.body || {};
      if (!name || !message) {
        return res.status(400).json({ success: false, error: "Name and message are required." });
      }
      if (name.length > 50 || message.length > 500) {
        return res.status(400).json({ success: false, error: "Name (50) or message (500) too long." });
      }
      if (containsBanned(name) || containsBanned(message)) {
        return res.status(400).json({ success: false, error: "Message contains inappropriate content." });
      }

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
    if (req.method === 'DELETE') {
      const adminKey = req.headers['x-admin-key'];
      if (adminKey !== ADMIN_PASSWORD) {
        return res.status(403).json({ success: false, error: "Unauthorized." });
      }
      const id = req.query?.id;
      if (!id) {
        return res.status(400).json({ success: false, error: "Entry ID required." });
      }
      await redis.hdel(GUESTBOOK_KEY, id);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ success: false, error: "Method not allowed." });
  } catch (error) {
    console.error("Guestbook API error:", error);
    return res.status(500).json({ success: false, error: "Internal server error." });
  }
}
