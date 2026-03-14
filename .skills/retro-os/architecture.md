# RetroOS — Architecture

## Directory Structure

```
retroOS_V1/
├── index.html              ← Single-page app. All windows live here.
├── css/
│   ├── main.css            ← Global OS chrome: windows, dock, desktop icons
│   ├── mail.css            ← Mail app (window, sidebar, list, detail, compose, notifications)
│   ├── finder.css          ← Finder sidebar and icon grid
│   ├── internet.css        ← Snoogle/Internet app
│   ├── calculator.css      ← Calculator app
│   ├── clock.css           ← Clock status app
│   ├── coffee.css          ← Coffee/Pizza app + buy-me-a-pizza button
│   ├── photo-viewer.css    ← Photo Viewer app
│   ├── trash.css           ← Trash easter egg, game options, skull icon
│   ├── sacrifice.css       ← Sacrifice ritual: blood rain, shake, glitch text
│   ├── projects.css        ← Projects window app
│   ├── terminal.css        ← Terminal app
│   ├── music.css           ← Music player
│   ├── matrix.css          ← Matrix theme easter egg
│   └── responsive.css      ← Mobile overrides
├── js/
│   ├── main.js             ← Boot sequence + initApp()
│   ├── system.js           ← Window manager + global OS state + createWindowFromTemplate
│   ├── auth.js             ← Login + welcome popup
│   ├── mail.js             ← Mail inbox data + send logic
│   ├── utils.js            ← Shared utility functions (typewriterEffect)
│   └── apps/
│       ├── finder.js       ← Finder navigation + renderFinderContent + finderData
│       ├── projects.js     ← Projects window: projectsData, openProjectsFolder, showProjectDetails
│       ├── calculator.js
│       ├── terminal.js
│       ├── music.js
│       ├── trash.js        ← Trash easter egg + Morphy the dog
│       └── sacrifice.js    ← Sacrifice ritual easter egg
├── assets/
│   ├── icons/
│   ├── wallpapers/
│   ├── sounds/
│   ├── album/
│   └── System_Architecture_Blueprint/
├── api/                    ← Vercel serverless functions
└── server/                 ← Local Express dev server
```

---

## Window Model

Each app is a `.window` div with a standard structure:

```html
<div id="app-id" class="window" style="display: none">
  <div class="title">
    <span>App Name</span>
    <span class="controls">
      <span class="ctrl ctrl-min" onclick="minimizeWindow('app-id')">−</span>
      <span class="ctrl ctrl-max" onclick="maximizeWindow('app-id')">O</span>
      <span class="ctrl ctrl-close" onclick="closeWindow('app-id')">×</span>
    </span>
  </div>
  <div class="content"><!-- app content --></div>
</div>
```

- `ctrl-min` = green circle (minimize)
- `ctrl-max` = yellow circle with Arial Bold "O" (maximize/restore)
- `ctrl-close` = red circle (close)
- **Calculator** has NO maximize button — it has a fixed size.

### createWindowFromTemplate (in `system.js`)

`createWindowFromTemplate(templateId, containerId)` clones an HTML `<template>` element, appends it to a container, calls `makeDraggable` and `bringToFront`. Used by `projects.js` and `auth.js`.

### Window Lifecycle States (`js/system.js`)

```javascript
windowStates[id] = "closed" | "open" | "minimized"
```

### Window layering

`bringToFront(el)` increments `zTop` and sets `el.style.zIndex`.

---

## Static vs. Template Windows

### Static (always in DOM, shown/hidden)
- `#calculator`, `#terminal`, `#finder`, `#mail`, `#internet`, `#settings`, `#music`, `#coffee`, `#photo-viewer`, etc.

### Template-based (cloned on demand)
- `#readme-template` → appended to `#readme-container` by `openReadMe()`
- `#welcome-template` → appended by `auth.js` after login

---

## Finder App (`js/apps/finder.js`)

The Finder has a 3-panel layout:
- **Sidebar:** Desktop, Documents, Downloads
- **Main area:** Dynamic icon grid rendered by `renderFinderContent(location)`

**Note:** Projects folder code (`openProjectsFolder`, `projectsData`, etc.) lives in `js/apps/projects.js`, NOT in finder.js.

### Finder locations and what they contain

| Location key | Contents |
|---|---|
| `"desktop"` | Mirrors actual `.desktop-icon` elements (ReadMe, Calculator, Pizza, My Site, My Socials) |
| `"documents"` | Album folder + System_Architecture_Blueprint folder |
| `"album"` | 4 image files driven by `finderData.album` array |
| `"system_architecture_blueprint"` | 3 image files driven by `finderData.system_architecture_blueprint` array |
| `"downloads"` | `SACRIFICE.exe` |

Image file data for `album` and `system_architecture_blueprint` is stored in the `finderData` object at the top of `finder.js`. To add/rename images, edit that object only — `renderFinderContent` reads it automatically.

When a `.finder-icon` is double-clicked, `handleFinderClick(name)` routes to the appropriate action using a lookup map.

### Special case — My Socials in Finder

The "My Socials" android-folder uses a special rendering path in `renderFinderContent()`.
When it detects `icon.classList.contains("android-folder")` it renders a 2×2 mini-grid
with grey background (`#e0e0e0`, border `2px solid #999`) instead of a single img.

---

## Desktop Icons (`.desktop-icon`)

All desktop icons are `position: absolute` elements in `index.html`.
They are draggable (handled by `makeDraggable()` in `system.js`).

### Left column (top → down)
1. ReadMe.txt (`top: 80px; left: 20px`)
2. Calculator (`top: 180px; left: 20px`)
3. Pizza (`top: 280px; left: 20px`)
4. My Site (`top: 380px; left: 20px`) — links to `https://abhinavkuchhal.com`

### Right column (top → down)
- My Socials android folder (`top: 100px; right: 20px`)

### Android-style "My Socials" folder
- Shows a 2×2 mini-grid of Twitter/Instagram/YouTube/LinkedIn icons inside a frosted-glass box.
- Clicking calls `toggleSocialsFolder(event)` in `system.js`.
- A dim overlay + centered expanded popup shows all 5 socials (+ GitHub) at full size.
- Clicking outside the popup closes it.

---

## Mail App (`js/mail.js`)

3-panel Apple Mail clone: Sidebar → Email List → Detail/Compose pane.

`inboxEmails` array holds all hardcoded lore emails (HR, Sequoia, Morpheus, etc.).

### View toggling
- `setMailView(view)` — unified helper that toggles all three panels at once. `"inbox"` shows list+detail, `"compose"` shows compose form.
- `showInboxView()` and `showComposeView()` are arrow function aliases for ease of use in HTML onclick.

### Send flow
- Compose form submits to backend `/api/send-message` (or `localhost:3001/api/send-message` locally).
- `MailService` auto-detects environment based on `window.location.hostname`.

### Notification CSS
- Notification styles are in `css/apps.css` under the `/* --- Mail Notifications --- */` section.
- `showNotification(message, type)` creates/removes DOM elements; no inline `<style>` injection.

---

## Photo Viewer App

- Window ID: `#photo-viewer`
- Opened via `openPhotoViewer(src, title)` in `system.js`.
- Image fills the content area using `width:100%; height:100%; object-fit:contain`.
- Has full minimize / maximize / close controls.

---

## Adding a New App — Checklist

1. Add `<div class="window" id="app-id" style="display:none">` in `index.html`.
2. Add launcher as `.dock-icon` in nav or `.desktop-icon` on the desktop.
3. Add CSS to `css/apps.css` (NOT `main.css`).
4. Create `js/apps/app-id.js` and add `<script>` tag in `index.html`.
5. Register init in `initApp()` inside `js/main.js` if needed.
