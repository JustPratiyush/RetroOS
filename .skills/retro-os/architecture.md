# RetroOS — Architecture

## Directory Structure

```text
retroOS_V1/
├── index.html
├── css/
│   ├── main.css
│   ├── finder.css
│   ├── mail.css
│   ├── internet.css
│   ├── settings.css
│   ├── guestbook.css
│   ├── noticeboard.css
│   └── responsive.css
├── js/
│   ├── main.js
│   ├── system.js
│   ├── auth.js
│   ├── mail.js
│   ├── utils.js
│   └── apps/
│       ├── finder.js
│       ├── projects.js
│       ├── terminal.js
│       ├── internet.js
│       ├── guestbook.js
│       ├── noticeboard.js
│       ├── trash.js
│       └── sacrifice.js
├── api/
│   ├── browser.js
│   ├── guestbook.js
│   ├── noticeboard.js
│   └── health.js
└── server/
```

## Window Model

Each window is a `.window` element in `index.html` with:

- a unique `id`
- a `.title` bar
- `.controls` containing `.ctrl-min`, `.ctrl-max`, and `.ctrl-close`
- a `.content` region

Calculator is the only regular window without a maximize control.

`js/system.js` owns the lifecycle:

- `openWindow(id)`
- `closeWindow(id)`
- `minimizeWindow(id)`
- `maximizeWindow(id)`
- `bringToFront(el)`
- `createWindowFromTemplate(templateId, containerId)`
- `openPhotoViewer(src, title)`

`windowStates[id]` tracks `closed`, `open`, or `minimized`.

## Desktop Icons And Shared Action Routing

Desktop icons are declared directly in `index.html` as `.desktop-icon` nodes. New icons are expected to use:

- `data-open-action`
- `data-open-target`
- optional `data-open-title`

`js/system.js` centralizes activation through `activateIconAction(action, target, options)`, which is reused by both desktop icons and Finder icons. Supported actions currently include:

- `window`
- `url`
- `readme`
- `projects`
- `socials`
- `finder-location`
- `photo`
- `purge`

Desktop icons are draggable via `makeIconDraggable()` and selectable through the `.selected` class in `css/main.css`.

## Finder App

`js/apps/finder.js` renders Finder content instead of hardcoding extra HTML in `index.html`.

Important pieces:

- `finderData` stores the document image datasets.
- `createFinderIcon()` builds standard Finder items.
- `createFinderSocialsIcon()` renders the Finder-safe opaque version of the `My Socials` folder.
- `initFinderInteractions()` binds click selection and activation for Finder items once at startup.
- `selectFinderLocation(location)` drives sidebar navigation.

Current Finder locations:

| Location key | Contents |
|---|---|
| `desktop` | Mirrors the live desktop icon set, including `My Socials` |
| `documents` | `Album` and `System Architecture Blueprint` |
| `album` | Images from `finderData.album` |
| `system architecture blueprint` | Images from `finderData["system architecture blueprint"]` |
| `downloads` | `installer.dmg` until purge state advances, then `PURGE` |

Inside Finder, `My Socials` should never reuse the frosted desktop look. It renders as an opaque gray 2x2 grid so it stays visible against the light Finder background.

## Mail App

`js/mail.js` now uses folder-based state instead of a single `inboxEmails` array.

Core structures:

- `mailFolders`: folder metadata and badge participation
- `mailData`: actual messages grouped under `inbox`, `important`, `spam`, `deleted`
- `activeMailFolder`: current folder tab
- `selectedMailByFolder`: remembered selection per folder

Core functions:

- `renderMailTabs()`
- `renderMailList()`
- `renderMailDetail()`
- `renderMailApp()`
- `setActiveMailFolder(folderId)`
- `selectMail(mailId)`
- `updateMailBadge()`

The unread dock badge only counts folders whose metadata sets `countsTowardBadge: true` currently `Inbox` and `Important`.

## Internet App

The Internet window is split between a Snoogle home screen and a browser pane.

Frontend:

- `js/apps/internet.js` owns browser state, search normalization, history, back navigation, and iframe click/form interception.
- Quick links and text submission route through `navigateInternet()`.
- Some domains are intentionally opened outside RetroOS because they block reliable iframe rendering.

Backend:

- `api/browser.js` fetches public `http` and `https` pages only.
- Private network targets, credentialed URLs, and unsafe protocols are blocked.
- Scripts are stripped from fetched HTML and links/forms are rewritten back through the proxy where possible.
- A small in-memory cache is used for repeated page loads.

## Terminal App

`js/apps/terminal.js` is a stateful shell, not a collection of hardcoded output strings.

It maintains:

- command history and history cursor
- current virtual path rooted at `~`
- session uptime
- Matrix mode state

It exposes a virtual filesystem with:

- `~/Applications`
- `~/Desktop`
- `~/Documents`
- `~/Downloads`
- `~/Projects`
- `~/Desktop/My Socials`
- `ReadMe.txt`

Bridge commands call the real UI helpers instead of duplicating behavior:

- `open`
- `close`
- `finder`
- `projects`
- `mail`
- `theme`
- `socials`

The `mail` command reads the same foldered mail data used by `js/mail.js`, so terminal mail counts and open actions stay aligned with the app UI.

## Guestbook And Notice Board

Both community apps are serverless-first:

- `api/guestbook.js` handles guestbook CRUD in Upstash Redis.
- `api/noticeboard.js` handles notice CRUD in Upstash Redis.
- Frontend code lives in `js/apps/guestbook.js` and `js/apps/noticeboard.js`.

Recent UI behavior worth noting:

- Guestbook compose includes an emoji picker and retro loading panel.
- Notice Board uses a matching loader before posts resolve.

## Adding A New App

1. Add the window markup to `index.html`.
2. Add the launcher in the desktop and/or dock if needed.
3. Create `css/<app>.css` and link it from `index.html`.
4. Create `js/apps/<app>.js` and load it with a deferred script tag.
5. Wire initialization in `js/main.js` or `js/system.js` only if the app actually needs startup behavior.
