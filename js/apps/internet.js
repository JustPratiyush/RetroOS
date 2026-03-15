// js/apps/internet.js

const internetState = {
  initialized: false,
  currentTarget: "",
  history: [],
};

const INTERNET_HOME_TARGET = "__RETROOS_SNOOGLE_HOME__";

const internetExternalDomains = [
  "github.com",
  "instagram.com",
  "linkedin.com",
  "youtube.com",
  "youtu.be",
  "google.com",
];

function buildInternetSearchUrl(query) {
  return `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
}

function decodeInternetHtmlEntities(value) {
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

function unwrapInternetRedirectTarget(targetUrl) {
  try {
    const parsed = new URL(decodeInternetHtmlEntities(targetUrl));
    const hostname = parsed.hostname.toLowerCase();

    if (
      (hostname === "duckduckgo.com" || hostname.endsWith(".duckduckgo.com")) &&
      parsed.searchParams.has("uddg")
    ) {
      return decodeInternetHtmlEntities(
        parsed.searchParams.get("uddg") || targetUrl
      );
    }

    return parsed.toString();
  } catch (_) {
    return targetUrl;
  }
}

function isInternetExternalOnlyHostname(hostname) {
  const lower = hostname.toLowerCase();
  return internetExternalDomains.some(
    (domain) => lower === domain || lower.endsWith(`.${domain}`)
  );
}

function shouldOpenInternetTargetExternally(targetUrl) {
  try {
    const parsed = new URL(targetUrl);
    return isInternetExternalOnlyHostname(parsed.hostname);
  } catch (_) {
    return false;
  }
}

function promptInternetExternalOpen(targetUrl) {
  const parsed = new URL(targetUrl);
  const shouldOpen = window.confirm(
    `${parsed.hostname} usually blocks rendering inside RetroOS.\n\nOpen it in a new browser tab instead?`
  );

  if (shouldOpen) {
    window.open(targetUrl, "_blank", "noopener,noreferrer");
    setInternetStatus(`Opened ${parsed.hostname} in a new tab.`);
  } else {
    setInternetStatus(`Stayed inside RetroOS. ${parsed.hostname} was not opened.`);
  }

  return shouldOpen;
}

function normalizeInternetTarget(input) {
  const value = input.trim();
  if (!value) return null;

  const hasProtocol = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(value);
  const looksLikeUrl =
    hasProtocol || (/^[^\s]+\.[^\s]+/.test(value) && !/\s/.test(value));

  if (!looksLikeUrl) {
    return {
      mode: "search",
      displayValue: value,
      targetUrl: buildInternetSearchUrl(value),
      status: `Searching the web for "${value}"...`,
    };
  }

  try {
    const parsed = new URL(hasProtocol ? value : `https://${value}`);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      throw new Error("unsupported protocol");
    }

    return {
      mode: "url",
      displayValue: parsed.toString(),
      targetUrl: parsed.toString(),
      status: `Loading ${parsed.hostname}...`,
    };
  } catch (_) {
    return {
      mode: "search",
      displayValue: value,
      targetUrl: buildInternetSearchUrl(value),
      status: `Searching the web for "${value}"...`,
    };
  }
}

function buildInternetProxyUrl(targetUrl) {
  return `/api/browser?url=${encodeURIComponent(targetUrl)}`;
}

function decodeInternetProxyUrl(frameUrl) {
  try {
    const parsed = new URL(frameUrl, window.location.origin);
    if (parsed.pathname !== "/api/browser") return frameUrl;
    return parsed.searchParams.get("url") || frameUrl;
  } catch (_) {
    return frameUrl;
  }
}

function resolveInternetFrameUrl(urlLike, fallbackBase) {
  try {
    return new URL(urlLike, fallbackBase).toString();
  } catch (_) {
    return urlLike;
  }
}

function getInternetElements() {
  return {
    windowEl: document.getElementById("internet"),
    frame: document.getElementById("internetBrowserFrame"),
    toolbar: document.querySelector("#internet .internet-title-tools"),
    form: document.getElementById("internetSearchForm"),
    homeForm: document.getElementById("internetHomeSearchForm"),
    backButton: document.getElementById("internetBackButton"),
    homeView: document.getElementById("internetBrowserHome"),
    input: document.getElementById("internetSearchInput"),
    homeInput: document.getElementById("internetHomeSearchInput"),
    loading: document.getElementById("internetBrowserLoading"),
    pane: document.getElementById("internetBrowserPane"),
    status: document.getElementById("internetStatusText"),
  };
}

function setInternetStatus(message) {
  const { status } = getInternetElements();
  if (status) status.textContent = message;
}

function setInternetLoading(isLoading) {
  const { loading } = getInternetElements();
  if (loading) loading.hidden = !isLoading;
}

function setInternetToolbarVisible(isVisible) {
  const { toolbar, windowEl } = getInternetElements();
  if (toolbar) toolbar.hidden = !isVisible;
  if (windowEl) {
    windowEl.classList.toggle("internet-toolbar-visible", isVisible);
  }
}

function setInternetInputValue(value) {
  const { input, homeInput } = getInternetElements();
  if (input) input.value = value;
  if (homeInput) homeInput.value = value;
}

function syncInternetBackButton() {
  const { backButton } = getInternetElements();
  if (!backButton) return;
  backButton.disabled = internetState.history.length === 0;
}

function showInternetHome() {
  const { frame, homeView, pane } = getInternetElements();

  internetState.currentTarget = "";
  internetState.history = [];
  if (homeView) homeView.hidden = false;
  if (pane) pane.hidden = true;
  if (frame) frame.src = "about:blank";
  setInternetToolbarVisible(false);
  setInternetInputValue("");
  setInternetLoading(false);
  setInternetStatus("Ready.");
  syncInternetBackButton();
}

function navigateInternet(inputValue, options = {}) {
  const { skipHistory = false } = options;
  const normalized = normalizeInternetTarget(inputValue);
  const { frame, homeView, pane } = getInternetElements();

  if (!normalized || !frame || !pane) return;
  const nextTargetUrl = unwrapInternetRedirectTarget(normalized.targetUrl);
  const isUnwrappedRedirect = nextTargetUrl !== normalized.targetUrl;
  const nextDisplayValue =
    normalized.mode === "url" || isUnwrappedRedirect
      ? nextTargetUrl
      : normalized.displayValue;
  let nextStatus = normalized.status;
  const currentTarget = internetState.currentTarget;

  if (isUnwrappedRedirect) {
    try {
      const parsed = new URL(nextTargetUrl);
      nextStatus = `Loading ${parsed.hostname}...`;
    } catch (_) {
      nextStatus = "Loading page...";
    }
  }

  if (
    (normalized.mode === "url" || isUnwrappedRedirect) &&
    shouldOpenInternetTargetExternally(nextTargetUrl)
  ) {
    promptInternetExternalOpen(nextTargetUrl);
    return;
  }

  if (!skipHistory && currentTarget !== nextTargetUrl) {
    internetState.history.push(currentTarget || INTERNET_HOME_TARGET);
  }

  internetState.currentTarget = nextTargetUrl;
  if (homeView) homeView.hidden = true;
  pane.hidden = false;
  setInternetToolbarVisible(true);
  setInternetInputValue(nextDisplayValue);
  syncInternetBackButton();

  setInternetLoading(true);
  setInternetStatus(nextStatus);
  frame.src = buildInternetProxyUrl(nextTargetUrl);
}

function goBackInternet() {
  while (internetState.history.length > 0) {
    const previousTarget = internetState.history.pop();
    if (previousTarget === internetState.currentTarget) continue;
    if (previousTarget === INTERNET_HOME_TARGET) {
      showInternetHome();
      return;
    }
    if (!previousTarget) continue;
    navigateInternet(previousTarget, { skipHistory: true });
    return;
  }

  syncInternetBackButton();
}

function handleInternetSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const input = form?.querySelector("input");
  const value = input?.value.trim();
  if (!value) return;
  navigateInternet(value);
}

function syncInternetFrameState() {
  const { frame } = getInternetElements();
  if (!frame) return;

  try {
    const currentFrameUrl =
      frame.contentWindow?.location?.href || frame.getAttribute("src") || "";
    const actualUrl = decodeInternetProxyUrl(currentFrameUrl);
    const title = frame.contentDocument?.title?.trim();

    if (actualUrl) {
      setInternetInputValue(actualUrl);
      internetState.currentTarget = actualUrl;
    }

    setInternetStatus(title || "Page loaded.");
  } catch (_) {
    setInternetStatus("Page loaded.");
  }
}

function attachInternetFrameInteractionHandlers() {
  const { frame } = getInternetElements();
  const doc = frame?.contentDocument;
  const win = frame?.contentWindow;
  if (!frame || !doc || !win) return;
  if (doc.documentElement.dataset.retroInternetBound === "true") return;

  doc.documentElement.dataset.retroInternetBound = "true";

  doc.addEventListener(
    "click",
    (event) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target =
        event.target instanceof Element ? event.target : event.target?.parentElement;
      const anchor = target?.closest("a[href]");
      if (!anchor) return;

      const rawHref = anchor.getAttribute("href");
      if (!rawHref || rawHref.startsWith("#")) return;

      event.preventDefault();

      const resolvedHref = resolveInternetFrameUrl(rawHref, win.location.href);
      const actualUrl = decodeInternetProxyUrl(resolvedHref);
      navigateInternet(actualUrl);
    },
    true
  );

  doc.addEventListener(
    "submit",
    (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;

      event.preventDefault();

      const method = (form.getAttribute("method") || "GET").trim().toUpperCase();
      const rawAction = form.getAttribute("action") || win.location.href;
      const resolvedAction = resolveInternetFrameUrl(rawAction, win.location.href);
      const actualAction = decodeInternetProxyUrl(resolvedAction);

      if (method !== "GET") {
        promptInternetExternalOpen(actualAction);
        return;
      }

      try {
        const nextUrl = new URL(actualAction);
        const formData = new FormData(form);
        for (const [key, value] of formData.entries()) {
          nextUrl.searchParams.append(key, String(value));
        }
        navigateInternet(nextUrl.toString());
      } catch (_) {
        navigateInternet(actualAction);
      }
    },
    true
  );
}

function initInternetApp() {
  const { backButton, form, frame, homeForm } = getInternetElements();
  if (!backButton || !form || !frame || !homeForm) return;
  if (internetState.initialized) return;

  form.addEventListener("submit", handleInternetSubmit);
  homeForm.addEventListener("submit", handleInternetSubmit);
  backButton.addEventListener("click", () => goBackInternet());
  frame.addEventListener("load", () => {
    setInternetLoading(false);
    if (internetState.currentTarget) {
      attachInternetFrameInteractionHandlers();
      syncInternetFrameState();
    }
  });

  document.querySelectorAll(".internet-favourite-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const url = button.getAttribute("data-url");
      if (url) navigateInternet(url);
    });
  });

  internetState.initialized = true;
  showInternetHome();
}

window.initInternetApp = initInternetApp;
