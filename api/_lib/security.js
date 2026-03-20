import crypto from "node:crypto";

const ADMIN_SESSION_COOKIE = "retroos_admin_session";
const ADMIN_SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const rateLimitStore = new Map();

function splitCsv(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getFirstHeaderValue(value) {
  return String(value || "")
    .split(",")[0]
    .trim();
}

function getForwardedHost(req) {
  return getFirstHeaderValue(req.headers?.["x-forwarded-host"] || req.headers?.host);
}

function getForwardedProto(req) {
  const forwardedProto = getFirstHeaderValue(req.headers?.["x-forwarded-proto"]);
  if (forwardedProto) return forwardedProto;

  const host = getForwardedHost(req).toLowerCase();
  if (!host) return "https";
  if (host.includes("localhost") || host.startsWith("127.") || host.startsWith("0.0.0.0")) {
    return "http";
  }

  return "https";
}

function appendResponseHeader(res, name, value) {
  const existing = res.getHeader(name);

  if (!existing) {
    res.setHeader(name, value);
    return;
  }

  if (Array.isArray(existing)) {
    res.setHeader(name, [...existing, value]);
    return;
  }

  res.setHeader(name, [existing, value]);
}

function cleanupRateLimitStore(now) {
  if (rateLimitStore.size < 1000) return;

  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

function signValue(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function encodeSessionPayload(payload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

function decodeSessionPayload(value) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

function serializeCookie(name, value, attributes = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];

  if (attributes.maxAge !== undefined) parts.push(`Max-Age=${attributes.maxAge}`);
  if (attributes.domain) parts.push(`Domain=${attributes.domain}`);
  if (attributes.path) parts.push(`Path=${attributes.path}`);
  if (attributes.expires) parts.push(`Expires=${attributes.expires.toUTCString()}`);
  if (attributes.httpOnly) parts.push("HttpOnly");
  if (attributes.secure) parts.push("Secure");
  if (attributes.sameSite) parts.push(`SameSite=${attributes.sameSite}`);

  return parts.join("; ");
}

export function getRequestOrigin(req) {
  const origin = getFirstHeaderValue(req.headers?.origin);
  if (origin) return origin;

  const referer = getFirstHeaderValue(req.headers?.referer);
  if (!referer) return "";

  try {
    return new URL(referer).origin;
  } catch {
    return "";
  }
}

export function getSelfOrigin(req) {
  const host = getForwardedHost(req);
  if (!host) return "";
  return `${getForwardedProto(req)}://${host}`;
}

export function getAllowedOrigins(req) {
  const allowed = new Set(splitCsv(process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGIN));
  const selfOrigin = getSelfOrigin(req);

  if (selfOrigin) {
    allowed.add(selfOrigin);
  }

  return allowed;
}

export function isAllowedOrigin(req) {
  const origin = getRequestOrigin(req);
  if (!origin) return true;
  return getAllowedOrigins(req).has(origin);
}

export function applyCors(req, res, options = {}) {
  const {
    methods = ["GET"],
    headers = ["Content-Type"],
    credentials = true,
  } = options;

  const origin = getRequestOrigin(req);
  if (origin && isAllowedOrigin(req)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");

    if (credentials) {
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }
  }

  res.setHeader("Access-Control-Allow-Methods", methods.join(","));
  res.setHeader("Access-Control-Allow-Headers", headers.join(", "));
}

export function rejectDisallowedOrigin(req, res) {
  if (isAllowedOrigin(req)) return false;

  res.status(403).json({
    success: false,
    error: "Origin not allowed.",
  });
  return true;
}

export function enforceTrustedWriteRequest(req, res) {
  const origin = getRequestOrigin(req);
  if (origin) {
    if (getAllowedOrigins(req).has(origin)) {
      return true;
    }

    res.status(403).json({
      success: false,
      error: "Cross-site write requests are blocked.",
    });
    return false;
  }

  const fetchSite = String(req.headers?.["sec-fetch-site"] || "").toLowerCase();
  if (!fetchSite || ["same-origin", "same-site", "none"].includes(fetchSite)) {
    return true;
  }

  res.status(403).json({
    success: false,
    error: "Cross-site write requests are blocked.",
  });
  return false;
}

export function markNoStore(res) {
  res.setHeader("Cache-Control", "no-store");
}

export function getClientIp(req) {
  const forwarded = getFirstHeaderValue(req.headers?.["x-forwarded-for"]);
  if (forwarded) return forwarded;

  const realIp = getFirstHeaderValue(req.headers?.["x-real-ip"]);
  if (realIp) return realIp;

  return String(req.socket?.remoteAddress || "unknown");
}

export function enforceRateLimit(req, res, options) {
  const {
    bucket,
    max,
    windowMs,
    errorMessage = "Too many requests. Please try again later.",
  } = options;

  const now = Date.now();
  cleanupRateLimitStore(now);

  const key = `${bucket}:${getClientIp(req)}`;
  let entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + windowMs };
    rateLimitStore.set(key, entry);
  }

  if (entry.count >= max) {
    const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    res.setHeader("Retry-After", String(retryAfterSeconds));
    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", "0");
    res.setHeader("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));
    res.status(429).json({
      success: false,
      error: errorMessage,
    });
    return false;
  }

  entry.count += 1;
  res.setHeader("X-RateLimit-Limit", String(max));
  res.setHeader("X-RateLimit-Remaining", String(Math.max(0, max - entry.count)));
  res.setHeader("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));
  return true;
}

export function safeCompareText(a, b) {
  const left = Buffer.from(String(a || ""), "utf8");
  const right = Buffer.from(String(b || ""), "utf8");

  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export function getAdminSecret() {
  const secret = String(process.env.ADMIN_SECRET_KEY || "").trim();
  if (secret.length < 24) {
    throw new Error("ADMIN_SECRET_KEY must be set and at least 24 characters long.");
  }

  return secret;
}

export function parseCookies(req) {
  return String(req.headers?.cookie || "")
    .split(";")
    .map((pair) => pair.trim())
    .filter(Boolean)
    .reduce((cookies, pair) => {
      const separatorIndex = pair.indexOf("=");
      if (separatorIndex === -1) return cookies;

      const key = pair.slice(0, separatorIndex).trim();
      const value = pair.slice(separatorIndex + 1).trim();
      cookies[key] = decodeURIComponent(value);
      return cookies;
    }, {});
}

export function createAdminSessionToken(secret, ttlMs = ADMIN_SESSION_TTL_MS) {
  const now = Date.now();
  const payload = {
    iat: now,
    exp: now + ttlMs,
    nonce: crypto.randomBytes(12).toString("base64url"),
  };
  const encodedPayload = encodeSessionPayload(payload);
  const signature = signValue(encodedPayload, secret);

  return `${encodedPayload}.${signature}`;
}

export function verifyAdminSessionToken(token, secret) {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return null;
  }

  const [encodedPayload, providedSignature] = token.split(".", 2);
  const expectedSignature = signValue(encodedPayload, secret);

  if (!safeCompareText(providedSignature, expectedSignature)) {
    return null;
  }

  try {
    const payload = decodeSessionPayload(encodedPayload);
    if (!payload || typeof payload.exp !== "number" || payload.exp <= Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function setAdminSessionCookie(req, res, token, ttlMs = ADMIN_SESSION_TTL_MS) {
  const secure = getForwardedProto(req) === "https";
  appendResponseHeader(
    res,
    "Set-Cookie",
    serializeCookie(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      maxAge: Math.floor(ttlMs / 1000),
      path: "/",
      sameSite: "Strict",
      secure,
    })
  );
}

export function clearAdminSessionCookie(req, res) {
  const secure = getForwardedProto(req) === "https";
  appendResponseHeader(
    res,
    "Set-Cookie",
    serializeCookie(ADMIN_SESSION_COOKIE, "", {
      expires: new Date(0),
      httpOnly: true,
      maxAge: 0,
      path: "/",
      sameSite: "Strict",
      secure,
    })
  );
}

export function hasValidAdminSession(req) {
  try {
    const secret = getAdminSecret();
    const token = parseCookies(req)[ADMIN_SESSION_COOKIE];
    return Boolean(verifyAdminSessionToken(token, secret));
  } catch {
    return false;
  }
}

export function requireAdminSession(req, res) {
  let secret;

  try {
    secret = getAdminSecret();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Server admin auth is not configured.",
    });
    return false;
  }

  const token = parseCookies(req)[ADMIN_SESSION_COOKIE];
  if (verifyAdminSessionToken(token, secret)) {
    return true;
  }

  clearAdminSessionCookie(req, res);
  res.status(401).json({
    success: false,
    error: "Admin session required.",
  });
  return false;
}
