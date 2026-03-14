---
name: retro-os
description: >
  The complete agent guide for RetroOS — a vanilla JS/CSS/HTML personal portfolio
  that simulates a classic desktop OS in the browser. Use this skill whenever
  making any change to this project. It defines the stack constraints, design rules,
  file organisation, and all app-by-app responsibilities.
---

# RetroOS Agent Skill

RetroOS is a **creative personal portfolio** built entirely on Vanilla HTML5, CSS3,
and JavaScript. It mimics a classic retro operating system UI in the browser.

**Owner:** Abhinav Kuchhal — `https://abhinavkuchhal.com`

---

## 🚨 Read These First

Before touching any code, load the relevant context file:

| What you need | File to read |
|---|---|
| Visual rules & CSS patterns | [design-philosophy.md](design-philosophy.md) |
| File structure & how apps are wired | [architecture.md](architecture.md) |
| Colors, fonts, spacing tokens | [tokens.md](tokens.md) |
| Dos and don'ts, common pitfalls | [conventions.md](conventions.md) |

---

## Stack at a Glance

- **No frameworks** — zero React, Vue, Angular or Next.js. Ever.
- **No CSS libraries** — no Tailwind, no Bootstrap. Plain CSS only.
- **Data Persistence** — Upstash Redis is used for databases (Guestbook, Notice Board) via Vercel serverless functions.
- Fonts loaded from Google Fonts: `VT323` (primary) and `Pixelify Sans` (accent).

---

## Key Entry Points

| File | Role |
|---|---|
| `index.html` | All static HTML, window containers, and templates |
| `js/main.js` | Boot sequence + `initApp()` |
| `js/system.js` | Window manager — open, close, minimize, maximize, drag, **createWindowFromTemplate** |
| `js/auth.js` | Login screen and welcome popup |
| `js/utils.js` | Shared utilities — `typewriterEffect()` |
| `js/mail.js` | Mail inbox data + dock badge logic (composition removed) |
| `js/apps/finder.js` | Finder navigation, `renderFinderContent`, `finderData` |
| `js/apps/projects.js` | Projects window app — `projectsData`, `openProjectsFolder` |
| `js/apps/trash.js` | Trash easter egg — Morphy the dog game |
| `js/apps/sacrifice.js` | Sacrifice ritual easter egg |
| `js/apps/guestbook.js` | Visitor Guestbook app (fetches from Redis) |
| `js/apps/noticeboard.js` | Developer Notice Board app (fetches from Redis) |
| `css/main.css` | Global layout, window chrome, desktop icons, dock |
| `css/mail.css` | Mail app styles |
| `css/finder.css` | Finder sidebar and icon grid |
| `css/internet.css` | Snoogle / Internet browser app |
| `css/calculator.css` | Calculator app |
| `css/clock.css` | Clock status popover |
| `css/coffee.css` | Coffee/Pizza app + buy-me-a-pizza button |
| `css/photo-viewer.css` | Photo Viewer app |
| `css/trash.css` | Trash easter egg, skull icon, game options |
| `css/sacrifice.css` | Sacrifice ritual animation, blood rain, glitch text |
| `css/projects.css` | Projects window app styles |
| `css/terminal.css` | Terminal app |
| `css/music.css` | Music player |
| `css/matrix.css` | Matrix theme easter egg |
| `css/guestbook.css` | Guestbook app styles |
| `css/noticeboard.css` | Notice Board app styles |
| `css/responsive.css` | Mobile-only overrides |

---

## CSS Rule: One File Per App

Each app's CSS lives in its own named file. **`apps.css` no longer exists.**

| App | CSS File |
|---|---|
| Mail | `css/mail.css` |
| Finder | `css/finder.css` |
| Internet/Snoogle | `css/internet.css` |
| Calculator | `css/calculator.css` |
| Clock | `css/clock.css` |
| Coffee/Pizza | `css/coffee.css` |
| Photo Viewer | `css/photo-viewer.css` |
| Trash Easter Egg | `css/trash.css` |
| Sacrifice Ritual | `css/sacrifice.css` |
| Projects | `css/projects.css` |
| Terminal | `css/terminal.css` |
| Music | `css/music.css` |
| Matrix | `css/matrix.css` |
| Guestbook | `css/guestbook.css` |
| Notice Board | `css/noticeboard.css` |

---

## JS Rule: One File Per Responsibility

Each JS file owns exactly one concern. Never add code to a file that doesn't match its name.

| File | Owns |
|---|---|
| `system.js` | Window lifecycle, drag, z-index, `createWindowFromTemplate()` |
| `auth.js` | Login sequence + welcome window |
| `mail.js` | `inboxEmails` data, `renderInbox`, `selectEmail`, dock badge logic |
| `utils.js` | Shared utilities — currently `typewriterEffect()` only |
| `finder.js` | Finder sidebar navigation, `renderFinderContent`, `finderData` |
| `projects.js` | `projectsData`, `openProjectsFolder`, `showProjectDetails`, `openReadMe` |
| `trash.js` | Trash easter egg game logic — Morphy, conversation states, skulls |
| `sacrifice.js` | Sacrifice ritual — blood rain, glitch text, ritual animation |
| `calculator.js` | Calculator logic |
| `terminal.js` | Terminal emulator |
| `music.js` | Spotify music player integration |
| `guestbook.js` | Guestbook list/detail/compose views, backend API integration |
| `noticeboard.js`| Notice Board feed, Admin compose view, backend API integration |
