# RetroOS — Conventions & Common Pitfalls

## ✅ DO These Things

### CSS
- When adding or modifying an app's styles, edit **that app's dedicated CSS file** — e.g. `css/mail.css` for mail, `css/finder.css` for finder. **`apps.css` no longer exists.**
- When creating a **new app**, also create a **new `css/<appname>.css`** file and add a `<link>` for it in `index.html`.
- Use `font-family: "VT323", monospace` for all application text.
- Use hard pixel shadows: `box-shadow: 5px 5px 0 rgba(0,0,0,0.9)` for buttons.
- Use `#000` background + `#fff` text for active/selected states (sidebar items, list items).
- Give social media / portfolio icons: `border-radius: 12px; border: 2px solid #000; box-shadow: 3px 3px 0 rgba(0,0,0,0.4)`.

### JavaScript
- All window open/close/minimize/maximize calls go through `system.js` functions.
- Always call `bringToFront(el)` when opening or clicking a window.
- To create a window from a `<template>` element: use `createWindowFromTemplate(templateId, containerId)` — defined in `system.js`.
- New desktop icons go in `index.html` as `<div class="desktop-icon">`.
- New dock icons go inside `<nav class="dock">` in `index.html`.
- To open a photo: call `openPhotoViewer(src, title)` — never directly manipulate `#photo-viewer`.
- The Finder desktop view loops over `.desktop-icon` elements — any new desktop icon automatically appears in Finder.
- Shared utilities (like `typewriterEffect`) belong in `js/utils.js`, not duplicated in app files.
- When creating a **new app JS file**, also add a `<script defer>` tag in `index.html` below the other app scripts.

### HTML
- Every window must have `class="window"` and a unique `id`.
- Every window must have the standard title bar with `.ctrl-min`, `.ctrl-max`, `.ctrl-close`.
- The Calculator window only gets `.ctrl-min` and `.ctrl-close` (no maximize).

---

## ❌ DO NOT Do These Things

### Hard rules (never break these)
- ❌ **Never introduce React, Vue, Angular, or any JS framework.**
- ❌ **Never use Tailwind, Bootstrap, or any CSS framework.**
- ❌ **Never use `transform: scale()` for hover/pulse animations** on standard UI elements.
- ❌ **Never use size-changing keyframe animations** (`@keyframes` that grow/shrink elements).
- ❌ **Never put app-specific CSS rules inside `main.css`** — use the app's dedicated CSS file.
- ❌ **Never put CSS inside a JS file** (e.g. using `document.createElement('style')`).
- ❌ **Never use Formspree, EmailJS, or similar** — the mail backend is custom Nodemailer.
- ❌ **Never use `sans-serif` as the fallback font** — use `monospace`.
- ❌ **Never write code belonging to App A inside App B's file** — one file, one responsibility.

### Soft rules (avoid unless you have a good reason)
- Avoid blue highlights (`#4a90e2`) for sidebar active states — use black.
- Avoid light `#eee` borders on dark-background-adjacent elements — use `#000`.
- Avoid `border-radius` values above `20px` on retro OS elements.
- Avoid gradients on buttons or interactive elements.
- Avoid adding multiple apps to the same JS or CSS file.

---

## Common Mistakes & Fixes

### "My Socials" folder looks invisible in the Finder
**Cause:** The frosted-glass `rgba(255,255,255,0.25)` background blends into the white Finder.  
**Fix:** In `finder.js` Finder rendering, use `background: #e0e0e0; border: 2px solid #999` instead.

### "Photo opens but doesn't fill the window"
**Cause:** `max-width`/`max-height` not scaled beyond natural image size.  
**Fix:** Use `width: 100%; height: 100%; object-fit: contain` on `#photo-viewer-img`.

### "New window doesn't come to front when opened"
**Cause:** `bringToFront()` not called.  
**Fix:** Call `bringToFront(document.getElementById('app-id'))` inside `openWindow()`.

### "Finder Desktop view shows wrong icon for an element"
**Cause:** `renderFinderContent("desktop")` reads the first `<img>` from each `.desktop-icon`.  
**Fix:** For custom elements (like the android-folder), add a special-case check for `icon.classList.contains("android-folder")`.

### "Icon size looks wrong vs others on desktop"
**Cause:** The `--file-icon-size` CSS variable is `64px`. Any overriding `width/height` on the img breaks consistency.  
**Fix:** Check for `!important` overrides in `main.css` — all `.desktop-icon img` inherit `width: var(--file-icon-size)`.

### "I can't find the Projects window code"
**Cause:** Projects code used to be in `finder.js` but was moved.  
**Fix:** It's in `js/apps/projects.js` — `projectsData`, `openProjectsFolder`, `showProjectDetails`, `openReadMe`.

### "typewriterEffect is not defined"
**Cause:** It was moved out of `trash.js`.  
**Fix:** It lives in `js/utils.js`. Confirm `<script src="js/utils.js" defer>` loads before `trash.js` in `index.html`.

### "createWindowFromTemplate is not defined"
**Cause:** It was moved out of `finder.js`.  
**Fix:** It lives in `js/system.js` — it's a window manager function, not a Finder function.

### "Apps CSS changes have no effect"
**Cause:** `apps.css` was deleted. Styles now live in named per-app files.  
**Fix:** Edit the CSS file that matches the app (e.g. `css/mail.css`, `css/trash.css`).

---

## Desktop Icon URLs by Social Platform

| Platform | Username | URL |
|---|---|---|
| Twitter/X | abhinavkuchhal | `https://x.com/abhinavkuchhal` |
| Instagram | abhinavkuchhal | `https://www.instagram.com/abhinavkuchhal/` |
| YouTube | @abhinavkuchhal | `https://www.youtube.com/@abhinavkuchhal` |
| LinkedIn | abhinav-kuchhal | `https://www.linkedin.com/in/abhinav-kuchhal/` |
| GitHub | abhinavkuchhal | `https://github.com/abhinavkuchhal` |
| Portfolio | — | `https://abhinavkuchhal.com` |

---

## Available Icon Assets (`assets/icons/`)

```
twitter.webp, instagram.webp, youtube.webp, linkedin.webp, github.webp
internet.webp, snoogle.webp, finder.webp, calculator.webp, music.webp
terminal.webp, trash.webp, mail.webp, folderIcon.webp, TxtIcon.webp
me.png   ← Abhinav's photo, used for the "My Site" desktop icon
appdrawer.webp, blogs.webp, pizza.webp, wifi.webp
logo.webp, logo.ico, og-image1.webp
dead_dog.webp, happy_dog.webp, sleeping_dog.webp, wise_dog.webp
sacrifice.png, s.png
```

---

## Finder Content Data Reference

### Documents
- `Album` folder → opens to 4 images in `assets/album/` — driven by `finderData.album` array in `finder.js`
- `System_Architecture_Blueprint` folder → opens to 3 images in `assets/System_Architecture_Blueprint/` — driven by `finderData.system_architecture_blueprint` array in `finder.js`
- **To add/rename images:** edit only the `finderData` object in `finder.js` — no HTML changes needed.

### Downloads  
- `SACRIFICE.exe` — the Easter egg trigger (drag the dead dog skull onto it)

### Desktop (auto-generated from `.desktop-icon` elements)
- ReadMe.txt, Calculator, Pizza, My Site, My Socials

---

## Mail App Data Reference

All inbox emails are hardcoded in the `inboxEmails` array in `js/mail.js`.  
To add a new email, append an object with: `from`, `sender`, `subject`, `date`, `read`, `body`.  
The `body` field supports basic HTML (`<strong>`, `<br>`, etc.).

### Mail view state
- `setMailView("inbox")` → shows email list + detail pane  
- `setMailView("compose")` → shows compose form  
- Never manipulate `display` styles directly — always use `setMailView()`.

---

## Backend / API Reference

| Endpoint | File | Purpose |
|---|---|---|
| `POST /api/send-message` | `api/send-message.js` | Sends contact email via Nodemailer |
| `GET /api/health` | `api/health.js` | Backend connectivity check |

- **Local dev:** runs Express on `localhost:3001`, served by `server/` directory.
- **Production:** Vercel serverless functions under `/api/`.
- `MailService` in `mail.js` auto-detects environment via `window.location.hostname`.
- Rate limit: 10 requests per 15 minutes (production).
