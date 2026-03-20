import { applyCors, rejectDisallowedOrigin } from "./_lib/security.js";

export default async function handler(req, res) {
  applyCors(req, res, {
    methods: ["GET", "OPTIONS"],
    headers: ["Content-Type"],
  });

  if (req.method === "OPTIONS") {
    if (rejectDisallowedOrigin(req, res)) return;
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed",
    });
  }

  if (rejectDisallowedOrigin(req, res)) return;

  res.status(200).json({
    success: true,
    message: "RetroOS Email Service is running",
    timestamp: new Date().toISOString(),
  });
}
