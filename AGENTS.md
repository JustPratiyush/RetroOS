# RetroOS Agent Guide

This file applies to the entire repository.

RetroOS is a single-page operating system sandbox that recreates a retro desktop OS in the browser. Treat it as a handcrafted vanilla web app, not a framework project. Changes should preserve the illusion of a 1990s operating system while keeping the codebase modular and predictable.

## Read First

The repo includes deeper source notes in `.skills/retro-os/`:

- `.skills/retro-os/SKILL.md`
- `.skills/retro-os/architecture.md`
- `.skills/retro-os/conventions.md`
- `.skills/retro-os/design-philosophy.md`
- `.skills/retro-os/tokens.md`

Use those when a task needs more detail. If they conflict with the live code, prefer the current codebase and update the docs if part of your task. One known stale note: `architecture.md` still mentions `css/apps.css` in one checklist entry, but this project uses per-app CSS files only.

## Stack And Architecture

- Frontend: vanilla HTML, CSS, and JavaScript only.
- Main UI entrypoint: `index.html`.
- Global frontend orchestration: `js/main.js`, `js/system.js`, `js/auth.js`, `js/mail.js`, `js/utils.js`.
- App modules live in `js/apps/`.
- App-specific styles live in `css/<app>.css`.
- Global OS chrome and shared layout live in `css/main.css`.
- Mobile overrides live in `css/responsive.css`.
- Serverless APIs live in `api/`.
- Local email backend lives in `server/`.
- Persistent app data uses Upstash Redis. Do not introduce Vercel KV, localStorage, or other persistence layers for core shared data.

Current backend split:

- `api/guestbook.js`: guestbook CRUD via Upstash Redis.
- `api/noticeboard.js`: notice board CRUD via Upstash Redis.
- `api/health.js`: health endpoint.
- `server/server.js`: Express/Nodemailer backend for email notifications.

## Project Map

- `index.html`: all desktop icons, dock items, window markup, and templates.
- `js/system.js`: window manager, drag behavior, z-index, window open/close/minimize/maximize, `createWindowFromTemplate()`, photo viewer helpers, desktop/social popup interactions.
- `js/main.js`: boot sequence and app initialization.
- `js/auth.js`: login flow and welcome popup.
- `js/mail.js`: inbox data and mail badge behavior.
- `js/utils.js`: shared helpers such as `typewriterEffect()`.
- `js/apps/finder.js`: Finder navigation and `finderData`.
- `js/apps/projects.js`: projects data and project/readme window creation.
- `js/apps/trash.js`: Morphy easter egg logic.
- `js/apps/sacrifice.js`: sacrifice ritual overlay and sequence.
- `js/apps/guestbook.js`: guestbook frontend behavior.
- `js/apps/noticeboard.js`: notice board frontend behavior.
- `js/apps/calculator.js`, `js/apps/terminal.js`, `js/apps/music.js`, `js/apps/datetime_battery_wifi.js`: app-specific logic for those features.

## Non-Negotiable Rules

- Do not add React, Vue, Angular, Next.js, Tailwind, Bootstrap, or any other framework/library that changes the architecture.
- Do not add app-specific CSS to `css/main.css`. Put it in the app’s own stylesheet.
- Do not put one app’s logic into another app’s JS file. Keep one file per concern.
- Do not inject CSS from JavaScript.
- Do not use third-party form services such as Formspree or EmailJS.
- Do not use `transform: scale()` hover effects or size-changing keyframe animations for normal UI components.
- Do not replace retro black-and-white selected states with modern blue UI patterns unless the existing design explicitly does so.
- Do not use `Pixelify Sans` for numbers. Numerical text must stay in `VT323`.

## Design System

RetroOS should feel like a physical, chunky, late-80s/90s desktop UI.

- Primary UI font: `VT323`, fallback `monospace`.
- Accent font: `Pixelify Sans`, used sparingly.
- Window title bars: dark background `#333333` with white text.
- Window borders: generally `3px solid #000`.
- Retro buttons: hard borders and hard shadows, typically `box-shadow: 5px 5px 0 rgba(0,0,0,0.9)`.
- Selected/active states: `background: #000; color: #fff`.
- Standard window panel grays: `#f0f0f0` and `#e0e0e0`.
- Desktop/Finder icon size baseline: `60px` via `--file-icon-size`.
- Avoid modern pill buttons, soft gradients on controls, oversized border radii, and SaaS-like styling.

Animation guidance:

- Prefer discrete state changes, drags, and positional movement.
- Avoid growth/shrink micro-animations on ordinary controls.
- The sacrifice sequence is an intentional exception and should remain isolated.

Special visual exception:

- The "My Socials" Android-style folder may use frosted-glass styling on the desktop.
- Inside Finder, that same folder should render with an opaque gray treatment so it stays visible on light backgrounds.

## Window And UI Patterns

Every window should follow the shared `.window` pattern in `index.html`:

- unique `id`
- `.title` bar
- `.controls` containing `.ctrl-min`, `.ctrl-max`, `.ctrl-close`
- `.content` area

Calculator is the exception: it should not have a maximize control.

Use the window manager instead of manual DOM state toggling:

- open/close/minimize/maximize through functions in `js/system.js`
- call `bringToFront(el)` when a window is opened or focused
- use `createWindowFromTemplate(templateId, containerId)` for template-cloned windows
- use `openPhotoViewer(src, title)` for image viewing instead of ad hoc photo logic

Desktop and dock rules:

- Desktop icons are declared directly in `index.html` as `.desktop-icon`.
- New desktop icons automatically surface in Finder’s desktop view.
- Dock items also belong in `index.html`.

## CSS And JS Organization

Per-app CSS files currently include:

- `css/mail.css`
- `css/finder.css`
- `css/internet.css`
- `css/calculator.css`
- `css/clock.css`
- `css/coffee.css`
- `css/photo-viewer.css`
- `css/trash.css`
- `css/sacrifice.css`
- `css/projects.css`
- `css/terminal.css`
- `css/music.css`
- `css/matrix.css`
- `css/guestbook.css`
- `css/noticeboard.css`

When adding a new app:

1. Add the window markup to `index.html`.
2. Add a launcher in the desktop and/or dock if needed.
3. Create `css/<app>.css` and link it from `index.html`.
4. Create `js/apps/<app>.js` and load it with a `<script defer>` in `index.html`.
5. Wire initialization in `js/main.js` or `js/system.js` only if the app needs it.

## Finder, Projects, And Content Notes

- Finder content is driven by `finderData` in `js/apps/finder.js`.
- Projects-specific logic lives in `js/apps/projects.js`, not in Finder.
- To add or rename album or blueprint assets, update `finderData` instead of hardcoding extra HTML.
- `renderFinderContent("desktop")` mirrors actual desktop icons, so desktop icon changes affect Finder automatically.

## Guestbook And Notice Board

- Frontend should call relative endpoints under `/api/...`.
- Guestbook and notice board data live in Upstash Redis.
- Admin routes rely on the `X-Admin-Key` header matching `ADMIN_SECRET_KEY`.
- There is currently a fallback admin password in the serverless functions; do not create more client-side secrets or widen that pattern.

## Email Backend

- `server/` is a separate Express service for email notifications.
- Keep it independent from the serverless guestbook/notice board APIs.
- If a task touches messaging or SMTP, inspect `server/README.md`, `server/package.json`, and `server/server.js` before changing behavior.

## Practical Editing Guidance

- Preserve the retro illusion first, then add capability.
- Prefer updating existing patterns over inventing a new UI language.
- Reuse existing helpers and CSS idioms before adding new abstractions.
- Keep HTML/CSS/JS readable and direct; this project does not need framework-style indirection.
- When behavior changes, verify both desktop and mobile implications because `css/responsive.css` may need a matching adjustment.
- If you add a new windowed feature, verify focus, dragging, stacking, and close/minimize behavior, not just the static markup.
