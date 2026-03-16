name: retro-os
description: >
The complete agent guide for RetroOS — a vanilla JS/CSS/HTML operating system sandbox
that simulates a classic desktop OS in the browser. Use this skill whenever
making any change to this project. It defines the stack constraints, design rules,
file organisation, and app-by-app responsibilities.

# RetroOS Agent Skill

RetroOS is a creative operating system sandbox built entirely with vanilla HTML5, CSS3, and JavaScript. It mimics a retro desktop operating system in the browser and relies on direct DOM patterns instead of framework abstractions.

**Owner:** Abhinav Kuchhal — `https://abhinavkuchhal.com`

## Read These First

Before touching code, load the smallest relevant context file:

| What you need                    | File to read                                 |
| -------------------------------- | -------------------------------------------- |
| Visual rules and CSS patterns    | [design-philosophy.md](design-philosophy.md) |
| File structure and app wiring    | [architecture.md](architecture.md)           |
| Colors, fonts, spacing tokens    | [tokens.md](tokens.md)                       |
| Dos, don'ts, and common pitfalls | [conventions.md](conventions.md)             |

## Stack At A Glance

- No frameworks: never add React, Vue, Angular, Next.js, or similar.
- No CSS libraries: plain CSS only, no Tailwind or Bootstrap.
- Persistence: Upstash Redis for Guestbook and Notice Board data.
- Browser proxy: `api/browser.js` rewrites public HTML for the in-app Internet window.
- Fonts: `VT323` is the primary UI font and the required font for numbers; `Pixelify Sans` is accent-only.

## Key Entry Points

| File                     | Role                                                                                                              |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| `index.html`             | All static HTML, windows, templates, desktop icons, and dock items                                                |
| `js/main.js`             | Boot sequence and `initApp()`                                                                                     |
| `js/system.js`           | Window manager, desktop/Finder icon action routing, drag logic, `createWindowFromTemplate()`, `openPhotoViewer()` |
| `js/auth.js`             | Login screen and welcome popup                                                                                    |
| `js/utils.js`            | Shared utilities such as `typewriterEffect()`                                                                     |
| `js/mail.js`             | Foldered mail data, selection state, `renderMailApp()`, dock badge logic                                          |
| `js/apps/finder.js`      | Finder navigation, `renderFinderContent()`, Finder icon factories, `finderData`                                   |
| `js/apps/projects.js`    | Projects window app — `projectsData`, `openProjectsFolder()`, `showProjectDetails()`                              |
| `js/apps/terminal.js`    | Stateful shell, command registry, virtual filesystem, app bridges                                                 |
| `js/apps/internet.js`    | Snoogle home/search, iframe navigation, Internet history                                                          |
| `js/apps/guestbook.js`   | Guestbook list/detail/compose views, emoji picker, API integration                                                |
| `js/apps/noticeboard.js` | Notice feed, admin compose/edit flow, API integration                                                             |
| `api/browser.js`         | Sanitized HTML proxy for the Internet window                                                                      |
| `api/guestbook.js`       | Guestbook CRUD via Upstash Redis                                                                                  |
| `api/noticeboard.js`     | Notice Board CRUD via Upstash Redis                                                                               |
| `css/main.css`           | Global layout, window chrome, desktop icons, dock                                                                 |
| `css/mail.css`           | Mail app styles                                                                                                   |
| `css/finder.css`         | Finder sidebar, icon grid, Finder-only socials folder styling                                                     |
| `css/internet.css`       | Internet browser app                                                                                              |
| `css/settings.css`       | Settings window overrides                                                                                         |
| `css/responsive.css`     | Mobile-only overrides                                                                                             |

## CSS Rule: One File Per App

Each app's CSS lives in its own named file. `apps.css` no longer exists.

| App          | CSS File               |
| ------------ | ---------------------- |
| Mail         | `css/mail.css`         |
| Finder       | `css/finder.css`       |
| Internet     | `css/internet.css`     |
| Calculator   | `css/calculator.css`   |
| Clock        | `css/clock.css`        |
| Coffee/Pizza | `css/coffee.css`       |
| Photo Viewer | `css/photo-viewer.css` |
| Trash        | `css/trash.css`        |
| Sacrifice    | `css/sacrifice.css`    |
| Projects     | `css/projects.css`     |
| Terminal     | `css/terminal.css`     |
| Music        | `css/music.css`        |
| Matrix       | `css/matrix.css`       |
| Guestbook    | `css/guestbook.css`    |
| Notice Board | `css/noticeboard.css`  |
| Settings     | `css/settings.css`     |

## JS Rule: One File Per Responsibility

Each JS file owns exactly one concern. Do not move logic into a file whose name no longer matches the behavior.

| File             | Owns                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| `system.js`      | Window lifecycle, drag, z-index, desktop icon activation, popup helpers                                 |
| `auth.js`        | Login sequence and welcome window                                                                       |
| `mail.js`        | `mailFolders`, `mailData`, `setActiveMailFolder()`, `selectMail()`, `renderMailApp()`, dock badge logic |
| `utils.js`       | Shared utilities                                                                                        |
| `finder.js`      | Finder sidebar navigation, icon rendering, Finder interaction binding, `finderData`                     |
| `projects.js`    | `projectsData`, project windows, readme windows                                                         |
| `terminal.js`    | Terminal emulator and virtual filesystem                                                                |
| `internet.js`    | Snoogle home state, proxy navigation, external-domain fallback                                          |
| `guestbook.js`   | Guestbook rendering, moderation checks, compose flow                                                    |
| `noticeboard.js` | Notice Board rendering, admin compose/edit flow                                                         |
| `trash.js`       | Trash easter egg game logic                                                                             |
| `sacrifice.js`   | Sacrifice ritual logic                                                                                  |
