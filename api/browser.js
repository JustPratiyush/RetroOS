import { applyCors, rejectDisallowedOrigin } from "./_lib/security.js";

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "169.254.169.254",
  "metadata.google.internal",
]);

const STRIP_SCRIPT_REGEX =
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;

const EXTERNAL_ONLY_DOMAINS = [
  "github.com",
  "instagram.com",
  "linkedin.com",
  "youtube.com",
  "youtu.be",
  "google.com",
];

const PAGE_CACHE_TTL_MS = 2 * 60 * 1000;
const PAGE_CACHE_MAX_ENTRIES = 40;
const pageCache = new Map();

function decodeHtmlEntities(value) {
  return String(value).replace(
    /&(#x?[0-9a-f]+|amp|lt|gt|quot|apos);/gi,
    (match, entity) => {
      const lower = entity.toLowerCase();

      if (lower === "amp") return "&";
      if (lower === "lt") return "<";
      if (lower === "gt") return ">";
      if (lower === "quot") return '"';
      if (lower === "apos") return "'";

      if (lower.startsWith("#x")) {
        const codePoint = Number.parseInt(lower.slice(2), 16);
        return Number.isNaN(codePoint) ? match : String.fromCodePoint(codePoint);
      }

      if (lower.startsWith("#")) {
        const codePoint = Number.parseInt(lower.slice(1), 10);
        return Number.isNaN(codePoint) ? match : String.fromCodePoint(codePoint);
      }

      return match;
    }
  );
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildProxyUrl(targetUrl, proxyOrigin = "") {
  return `${proxyOrigin}/api/browser?url=${encodeURIComponent(targetUrl)}`;
}

function getProxyOrigin(req) {
  const forwardedProto = String(
    req.headers?.["x-forwarded-proto"] || ""
  )
    .split(",")[0]
    .trim();
  const forwardedHost = String(
    req.headers?.["x-forwarded-host"] || req.headers?.host || ""
  )
    .split(",")[0]
    .trim();

  if (!forwardedHost) return "";

  const protocol =
    forwardedProto ||
    (forwardedHost.includes("localhost") || forwardedHost.startsWith("127.")
      ? "http"
      : "https");

  return `${protocol}://${forwardedHost}`;
}

function getCachedPage(cacheKey) {
  const cached = pageCache.get(cacheKey);
  if (!cached) return null;

  if (cached.expiresAt <= Date.now()) {
    pageCache.delete(cacheKey);
    return null;
  }

  return cached;
}

function setCachedPage(cacheKey, html) {
  pageCache.set(cacheKey, {
    html,
    expiresAt: Date.now() + PAGE_CACHE_TTL_MS,
  });

  if (pageCache.size <= PAGE_CACHE_MAX_ENTRIES) return;

  const oldestKey = pageCache.keys().next().value;
  if (oldestKey) pageCache.delete(oldestKey);
}

function isPrivateIpv4(hostname) {
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return false;

  const octets = hostname.split(".").map(Number);
  if (octets.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return true;
  }

  return (
    octets[0] === 10 ||
    octets[0] === 127 ||
    (octets[0] === 169 && octets[1] === 254) ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168)
  );
}

function isPrivateHostname(hostname) {
  const lower = hostname.toLowerCase();
  return (
    BLOCKED_HOSTNAMES.has(lower) ||
    lower.endsWith(".local") ||
    lower.endsWith(".internal") ||
    lower.startsWith("127.") ||
    lower.startsWith("10.") ||
    lower.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(lower) ||
    isPrivateIpv4(lower) ||
    lower.startsWith("[::1]") ||
    lower.startsWith("[fc") ||
    lower.startsWith("[fd")
  );
}

function normalizeTargetUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") {
    throw new Error("Missing url parameter.");
  }

  const targetUrl = new URL(rawUrl);
  if (!["http:", "https:"].includes(targetUrl.protocol)) {
    throw new Error("Only http and https URLs are supported.");
  }
  if (targetUrl.username || targetUrl.password) {
    throw new Error("Credentials in URLs are not allowed.");
  }
  if (isPrivateHostname(targetUrl.hostname)) {
    throw new Error("Private network addresses are blocked.");
  }

  return targetUrl;
}

function unwrapKnownRedirectTarget(targetUrl) {
  const parsed =
    targetUrl instanceof URL ? new URL(targetUrl.toString()) : new URL(targetUrl);
  const hostname = parsed.hostname.toLowerCase();

  if (
    (hostname === "duckduckgo.com" || hostname.endsWith(".duckduckgo.com")) &&
    parsed.searchParams.has("uddg")
  ) {
    return normalizeTargetUrl(
      decodeHtmlEntities(parsed.searchParams.get("uddg") || targetUrl.toString())
    );
  }

  return parsed;
}

function isExternalOnlyHostname(hostname) {
  const lower = hostname.toLowerCase();
  return EXTERNAL_ONLY_DOMAINS.some(
    (domain) => lower === domain || lower.endsWith(`.${domain}`)
  );
}

function isRedirectStatus(status) {
  return [301, 302, 303, 307, 308].includes(status);
}

async function fetchWithValidatedRedirects(targetUrl, controller) {
  let currentUrl = targetUrl;

  for (let hop = 0; hop < 5; hop += 1) {
    const response = await fetch(currentUrl, {
      redirect: "manual",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; RetroOSBrowser/1.0; +https://abhinavkuchhal.com)",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!isRedirectStatus(response.status)) {
      return { response, finalUrl: currentUrl.toString() };
    }

    const location = response.headers.get("location");
    if (!location) {
      return { response, finalUrl: currentUrl.toString() };
    }

    currentUrl = normalizeTargetUrl(new URL(location, currentUrl).toString());
  }

  throw new Error("Too many redirects.");
}

function resolvePublicUrl(rawValue, baseUrl) {
  const value = decodeHtmlEntities(String(rawValue || "").trim());
  if (
    !value ||
    value.startsWith("#") ||
    /^(data:|blob:|about:|mailto:|tel:|javascript:)/i.test(value)
  ) {
    return null;
  }

  try {
    const resolved = normalizeTargetUrl(new URL(value, baseUrl).toString());

    if (
      resolved.pathname === "/_next/image" &&
      resolved.searchParams.has("url")
    ) {
      const originalAssetUrl = decodeHtmlEntities(
        resolved.searchParams.get("url") || ""
      );

      if (originalAssetUrl) {
        return normalizeTargetUrl(
          new URL(originalAssetUrl, resolved.origin).toString()
        ).toString();
      }
    }

    return resolved.toString();
  } catch (_) {
    return null;
  }
}

function isJavascriptUrl(rawValue) {
  return /^javascript:/i.test(String(rawValue || "").trim());
}

function rewriteCssUrls(cssText, baseUrl) {
  return cssText
    .replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi, (match, quote, rawValue) => {
      const resolved = resolvePublicUrl(rawValue, baseUrl);
      if (!resolved) return match;
      return `url("${escapeHtml(resolved)}")`;
    })
    .replace(
      /@import\s+(url\(\s*)?(['"]?)(.*?)\2(\s*\))?/gi,
      (match, urlPrefix, quote, rawValue, urlSuffix) => {
        const resolved = resolvePublicUrl(rawValue, baseUrl);
        if (!resolved) return match;
        if (urlPrefix) {
          return `@import url("${escapeHtml(resolved)}")`;
        }
        return `@import "${escapeHtml(resolved)}"`;
      }
    );
}

function normalizeInlineStyleForStaticRender(styleText) {
  const rawStyle = String(styleText || "");
  if (!rawStyle.trim()) return rawStyle;

  const declarations = rawStyle
    .split(";")
    .map((declaration) => declaration.trim())
    .filter(Boolean);

  if (!declarations.length) return rawStyle;

  const parsedDeclarations = declarations.map((declaration) => {
    const separatorIndex = declaration.indexOf(":");
    if (separatorIndex === -1) {
      return {
        property: declaration.trim().toLowerCase(),
        value: "",
        original: declaration,
      };
    }

    return {
      property: declaration.slice(0, separatorIndex).trim().toLowerCase(),
      value: declaration.slice(separatorIndex + 1).trim(),
      original: declaration,
    };
  });

  const hasHydrationHiddenState = parsedDeclarations.some(
    ({ property, value }) =>
      (property === "opacity" && /^0(?:\.0+)?$/i.test(value)) ||
      (property === "visibility" && /^hidden$/i.test(value))
  );

  if (!hasHydrationHiddenState) return rawStyle;

  const normalizedDeclarations = parsedDeclarations.filter(
    ({ property, value }) => {
      if (property === "opacity" && /^0(?:\.0+)?$/i.test(value)) {
        return false;
      }

      if (property === "visibility" && /^hidden$/i.test(value)) {
        return false;
      }

      if (
        (property === "filter" || property === "backdrop-filter") &&
        /blur\s*\(/i.test(value)
      ) {
        return false;
      }

      if (
        property === "transform" &&
        /(translate|scale|rotate|skew|matrix)/i.test(value)
      ) {
        return false;
      }

      if (property === "pointer-events" && /^none$/i.test(value)) {
        return false;
      }

      return true;
    }
  );

  return normalizedDeclarations.map(({ original }) => original).join("; ");
}

function rewriteSrcset(value, baseUrl) {
  return value
    .split(",")
    .map((entry) => {
      const trimmed = entry.trim();
      if (!trimmed) return trimmed;

      const parts = trimmed.split(/\s+/);
      const resolved = resolvePublicUrl(parts[0], baseUrl);
      if (!resolved) return trimmed;
      parts[0] = resolved;
      return parts.join(" ");
    })
    .join(", ");
}

function rewriteMetaRefresh(content, baseUrl, proxyOrigin) {
  return content.replace(/url\s*=\s*([^;]+)/i, (match, rawValue) => {
    const cleaned = rawValue.trim().replace(/^['"]|['"]$/g, "");
    const resolved = resolvePublicUrl(cleaned, baseUrl);
    if (!resolved) return match;
    return `url=${buildProxyUrl(resolved, proxyOrigin)}`;
  });
}

function rewriteTagAttributes(html, baseUrl, proxyOrigin) {
  return html.replace(/<([a-zA-Z][\w:-]*)([^>]*)>/g, (fullTag, tagName, attrs) => {
    const lowerTag = tagName.toLowerCase();

    if (lowerTag === "base") {
      return "";
    }

    if (
      lowerTag === "link" &&
      /\s+rel\s*=\s*(?:"(?:preload|prefetch|preconnect|dns-prefetch|modulepreload|manifest)"|'(?:preload|prefetch|preconnect|dns-prefetch|modulepreload|manifest)'|(?:preload|prefetch|preconnect|dns-prefetch|modulepreload|manifest))/i.test(
        attrs
      )
    ) {
      return "";
    }

    let rewritten = attrs
      .replace(/\s+on[\w:-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
      .replace(/\s+nonce\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
      .replace(/\s+integrity\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");

    const methodMatch =
      lowerTag === "form"
        ? rewritten.match(
            /\s+method\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i
          )
        : null;
    const formMethod =
      (methodMatch?.[1] || methodMatch?.[2] || methodMatch?.[3] || "GET")
        .trim()
        .toUpperCase();

    rewritten = rewritten.replace(
      /\s+(href|src|action|poster|srcset|style)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi,
      (match, attrName, doubleQuoted, singleQuoted, bareValue) => {
        const attr = attrName.toLowerCase();
        const value = doubleQuoted ?? singleQuoted ?? bareValue ?? "";

        if (attr === "style") {
          return ` ${attrName}="${escapeHtml(
            rewriteCssUrls(normalizeInlineStyleForStaticRender(value), baseUrl)
          )}"`;
        }

        if (attr === "srcset") {
          return ` ${attrName}="${escapeHtml(rewriteSrcset(value, baseUrl))}"`;
        }

        const resolved = resolvePublicUrl(value, baseUrl);
        if (!resolved) {
          if (isJavascriptUrl(value)) {
            const safeValue =
              attr === "href"
                ? "#"
                : attr === "action"
                  ? buildProxyUrl(baseUrl, proxyOrigin)
                  : "";
            return ` ${attrName}="${escapeHtml(safeValue)}"`;
          }
          return ` ${attrName}="${escapeHtml(value)}"`;
        }

        if ((lowerTag === "a" || lowerTag === "area") && attr === "href") {
          return ` ${attrName}="${escapeHtml(
            buildProxyUrl(resolved, proxyOrigin)
          )}"`;
        }

        if (lowerTag === "form" && attr === "action") {
          const nextAction =
            formMethod === "GET"
              ? buildProxyUrl(resolved, proxyOrigin)
              : resolved;
          return ` ${attrName}="${escapeHtml(nextAction)}"`;
        }

        return ` ${attrName}="${escapeHtml(resolved)}"`;
      }
    );

    if (
      lowerTag === "meta" &&
      /\s+http-equiv\s*=\s*(?:"refresh"|'refresh'|refresh)/i.test(rewritten)
    ) {
      rewritten = rewritten.replace(
        /\s+content\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i,
        (match, doubleQuoted, singleQuoted, bareValue) => {
          const value = doubleQuoted ?? singleQuoted ?? bareValue ?? "";
          return ` content="${escapeHtml(
            rewriteMetaRefresh(value, baseUrl, proxyOrigin)
          )}"`;
        }
      );
    }

    if (lowerTag === "a" || lowerTag === "area" || lowerTag === "form") {
      if (/\s+target\s*=/i.test(rewritten)) {
        rewritten = rewritten.replace(
          /\s+target\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,
          ' target="_self"'
        );
      } else {
        rewritten += ' target="_self"';
      }
    }

    if (lowerTag === "img") {
      if (!/\s+loading\s*=/i.test(rewritten)) {
        rewritten += ' loading="lazy"';
      }
      if (!/\s+decoding\s*=/i.test(rewritten)) {
        rewritten += ' decoding="async"';
      }
    }

    return `<${tagName}${rewritten}>`;
  });
}

function transformHtmlDocument(html, targetUrl, proxyOrigin) {
  const withoutScripts = html.replace(STRIP_SCRIPT_REGEX, "");
  const withoutCspMeta = withoutScripts
    .replace(/<meta[^>]+http-equiv=["']Content-Security-Policy["'][^>]*>/gi, "")
    .replace(/<meta[^>]+http-equiv=["']X-Frame-Options["'][^>]*>/gi, "");

  const withRewrittenTags = rewriteTagAttributes(
    withoutCspMeta,
    targetUrl,
    proxyOrigin
  );
  const withRewrittenStyles = withRewrittenTags.replace(
    /<style\b([^>]*)>([\s\S]*?)<\/style>/gi,
    (match, attrs, cssContent) =>
      `<style${attrs}>${rewriteCssUrls(cssContent, targetUrl)}</style>`
  );

  const injectedHead = `
    <base href="${escapeHtml(targetUrl.toString())}" target="_self">
    <meta name="referrer" content="no-referrer">
  `;

  if (/<head[^>]*>/i.test(withRewrittenStyles)) {
    return withRewrittenStyles.replace(
      /<head[^>]*>/i,
      (match) => `${match}${injectedHead}`
    );
  }

  if (/<html[^>]*>/i.test(withRewrittenStyles)) {
    return withRewrittenStyles.replace(
      /<html[^>]*>/i,
      (match) => `${match}<head>${injectedHead}</head>`
    );
  }

  return `<!DOCTYPE html><html><head>${injectedHead}</head><body>${withRewrittenStyles}</body></html>`;
}

function renderErrorPage(message, statusCode = 400) {
  return {
    statusCode,
    html: `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <title>Internet App Error</title>
          <style>
            body {
              margin: 0;
              padding: 24px;
              background: #f0f0f0;
              color: #000;
              font-family: "VT323", monospace;
            }
            .error-card {
              max-width: 680px;
              margin: 0 auto;
              padding: 18px;
              border: 3px solid #000;
              background: #fff;
              box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.5);
            }
            h1 {
              margin: 0 0 12px;
              font-size: 34px;
            }
            p {
              margin: 0;
              font-size: 24px;
              line-height: 1.4;
            }
          </style>
        </head>
        <body>
          <div class="error-card">
            <h1>Browser Error</h1>
            <p>${escapeHtml(message)}</p>
          </div>
        </body>
      </html>`,
  };
}

function renderExternalPromptPage(targetUrl) {
  const hostname = targetUrl.hostname;
  const safeUrl = escapeHtml(targetUrl.toString());

  return {
    statusCode: 200,
    html: `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <title>Open Externally</title>
          <style>
            body {
              margin: 0;
              padding: 24px;
              background: #f0f0f0;
              color: #000;
              font-family: "VT323", monospace;
            }
            .prompt-card {
              max-width: 720px;
              margin: 0 auto;
              padding: 18px;
              border: 3px solid #000;
              background: #fff;
              box-shadow: 8px 8px 0 rgba(0, 0, 0, 0.5);
            }
            h1 {
              margin: 0 0 12px;
              font-size: 34px;
            }
            p {
              margin: 0 0 18px;
              font-size: 24px;
              line-height: 1.4;
            }
            .prompt-actions {
              display: flex;
              gap: 12px;
              flex-wrap: wrap;
            }
            .prompt-btn {
              display: inline-block;
              padding: 10px 16px;
              border: 3px solid #000;
              background: #fff;
              color: #000;
              text-decoration: none;
              box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.85);
              font-size: 22px;
            }
          </style>
        </head>
        <body>
          <div class="prompt-card">
            <h1>Open In New Tab?</h1>
            <p>${hostname} blocks reliable rendering inside the RetroOS Internet window.</p>
            <p>Open this site in a real browser tab instead?</p>
            <div class="prompt-actions">
              <a class="prompt-btn" href="${safeUrl}" target="_blank" rel="noopener noreferrer">Open ${hostname}</a>
            </div>
          </div>
        </body>
      </html>`,
  };
}

export default async function handler(req, res) {
  applyCors(req, res, {
    methods: ["GET", "OPTIONS"],
    headers: ["Content-Type"],
  });
  res.setHeader("Cache-Control", "public, max-age=120, stale-while-revalidate=300");

  if (req.method === "OPTIONS") {
    if (rejectDisallowedOrigin(req, res)) return;
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  if (rejectDisallowedOrigin(req, res)) return;

  const proxyOrigin = getProxyOrigin(req);

  let targetUrl;
  try {
    targetUrl = unwrapKnownRedirectTarget(normalizeTargetUrl(req.query?.url));
  } catch (error) {
    const failure = renderErrorPage(error.message);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(failure.statusCode).send(failure.html);
  }

  if (isExternalOnlyHostname(targetUrl.hostname)) {
    const promptPage = renderExternalPromptPage(targetUrl);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(promptPage.statusCode).send(promptPage.html);
  }

  const cacheKey = `${proxyOrigin}|${targetUrl.toString()}`;
  const cachedPage = getCachedPage(cacheKey);
  if (cachedPage) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("X-RetroOS-Cache", "HIT");
    return res.status(200).send(cachedPage.html);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const { response: upstream, finalUrl } = await fetchWithValidatedRedirects(
      targetUrl,
      controller
    );

    clearTimeout(timeout);

    const contentType = upstream.headers.get("content-type") || "";
    if (!upstream.ok) {
      const failure = renderErrorPage(
        `The site responded with ${upstream.status} ${upstream.statusText}.`,
        upstream.status
      );
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.status(failure.statusCode).send(failure.html);
    }

    if (!contentType.includes("text/html")) {
      const body = Buffer.from(await upstream.arrayBuffer());
      res.status(200);
      res.setHeader("Content-Type", contentType || "application/octet-stream");
      return res.send(body);
    }

    const html = await upstream.text();
    const rewrittenHtml = transformHtmlDocument(
      html,
      new URL(finalUrl),
      proxyOrigin
    );
    setCachedPage(cacheKey, rewrittenHtml);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("X-RetroOS-Cache", "MISS");
    return res.status(200).send(rewrittenHtml);
  } catch (error) {
    clearTimeout(timeout);

    const failure = renderErrorPage(
      error.name === "AbortError"
        ? "The request timed out before the page finished loading."
        : "RetroOS could not load that page inside the Internet window."
    );

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(502).send(failure.html);
  }
}
