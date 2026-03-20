import {
  applyCors,
  clearAdminSessionCookie,
  createAdminSessionToken,
  enforceRateLimit,
  enforceTrustedWriteRequest,
  getAdminSecret,
  hasValidAdminSession,
  markNoStore,
  rejectDisallowedOrigin,
  safeCompareText,
  setAdminSessionCookie,
} from "../_lib/security.js";

export default async function handler(req, res) {
  applyCors(req, res, {
    methods: ["GET", "OPTIONS", "POST", "DELETE"],
    headers: ["Content-Type"],
  });
  markNoStore(res);

  if (req.method === "OPTIONS") {
    if (rejectDisallowedOrigin(req, res)) return;
    return res.status(204).end();
  }

  if (req.method === "GET") {
    if (rejectDisallowedOrigin(req, res)) return;
    return res.status(200).json({
      success: true,
      authenticated: hasValidAdminSession(req),
    });
  }

  if (req.method === "DELETE") {
    if (rejectDisallowedOrigin(req, res)) return;
    if (!enforceTrustedWriteRequest(req, res)) return;

    clearAdminSessionCookie(req, res);
    return res.status(200).json({
      success: true,
      authenticated: false,
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed.",
    });
  }

  if (rejectDisallowedOrigin(req, res)) return;
  if (!enforceTrustedWriteRequest(req, res)) return;
  if (
    !enforceRateLimit(req, res, {
      bucket: "admin-login",
      max: 5,
      windowMs: 15 * 60 * 1000,
      errorMessage: "Too many admin login attempts. Please wait and try again.",
    })
  ) {
    return;
  }

  let adminSecret;

  try {
    adminSecret = getAdminSecret();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Server admin auth is not configured.",
    });
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};
  const password = typeof body.password === "string" ? body.password : "";

  if (!password) {
    return res.status(400).json({
      success: false,
      error: "Password is required.",
    });
  }

  if (!safeCompareText(password, adminSecret)) {
    return res.status(401).json({
      success: false,
      error: "Invalid admin password.",
    });
  }

  const token = createAdminSessionToken(adminSecret);
  setAdminSessionCookie(req, res, token);

  return res.status(200).json({
    success: true,
    authenticated: true,
  });
}
