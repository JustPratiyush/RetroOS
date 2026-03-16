# RetroOS — Conventions & Common Pitfalls

## Do These Things

### CSS

- Keep app-specific styles in that app's stylesheet. `css/main.css` is for shared OS chrome only.
- Add a new `css/<app>.css` file when adding a new app. Link it from `index.html`.
- Use `VT323` for UI copy and all numeric text.
- Keep interaction states hard-edged: black selection fills, hard borders, hard shadows.
- When desktop-only styling needs a Finder-safe counterpart like `My Socials`, add the override in the app stylesheet instead of weakening the desktop treatment.

### JavaScript

- Route all window lifecycle changes through `js/system.js`.
- Use `createWindowFromTemplate()` for template-cloned windows.
- Use `openPhotoViewer()` for image viewing.
- Put desktop launch behavior on `data-open-action` and `data-open-target` instead of inline one-off logic.
- If a Finder item should mimic a desktop icon, feed the same action metadata through `activateIconAction()`.
- For the Internet app, use `navigateInternet()` instead of calling `window.open()` when the intent is in-app browsing.
- For the Mail app, update `mailFolders` and `mailData`, then let `setActiveMailFolder()`, `selectMail()`, and `renderMailApp()` handle the UI state.

### HTML

- Every window needs a unique `id`, a `.title`, `.controls`, and a `.content` region.
- Calculator keeps only minimize and close controls.
- Desktop icons belong directly in `index.html` so Finder can mirror them.

## Do Not Do These Things

- Never introduce React, Vue, Angular, Next.js, Tailwind, Bootstrap, or other framework layers.
- Never inject CSS from JavaScript.
- Never move app logic into another app's JS file.
- Never replace the retro black-and-white active states with default modern blue UI.
- Never use `Pixelify Sans` for numbers.
- Never add new persistent shared data stores for core app data. Guestbook and Notice Board stay on Upstash Redis.

## Common Mistakes & Fixes

### "My Socials" is missing or unreadable in Finder

Cause: Finder cannot reuse the frosted desktop version directly.
Fix: In `finder.js`, detect the desktop Android folder and render a Finder-specific gray 2x2 grid. Style it in `css/finder.css`, not `css/main.css`.

### "A desktop icon opens correctly, but Finder does not"

Cause: The desktop icon's action lives only in inline HTML or one-off code.
Fix: Put the behavior behind `data-open-action` and `data-open-target` so Finder can reuse it through `activateIconAction()`.

### "Terminal mail commands stopped working after mail changes"

Cause: `js/mail.js` is no longer a single `inboxEmails` list.
Fix: Read from `mailFolders` and `mailData`, and select messages through `setActiveMailFolder()` plus `selectMail()`.

### "The in-app browser opens a real tab instead of using the Internet window"

Cause: The code bypassed the Internet app and used `window.open()` directly.
Fix: Use `navigateInternet()` for in-app searches and URLs. Only open a real tab for domains intentionally treated as external-only.

### "The browser proxy loads unsafe or local URLs"

Cause: A URL bypassed the validation path in `api/browser.js`.
Fix: Always normalize through the proxy handler. It only supports public `http` and `https` targets and blocks private network hosts.

### "Icon size looks wrong on the desktop"

Cause: The base desktop icon size is `60px`, not `64px`.
Fix: Respect `--file-icon-size` from `css/main.css`. The `64px` value belongs only to the Android folder box.

## Desktop Social Links

| Platform | URL used in the live UI |
|---|---|
| Sandbox | `https://abhinavkuchhal.com` |
| GitHub | `https://github.com/JustPratiyush` |
| X | `https://x.com/JustPratiyush` |
| Instagram | `https://www.instagram.com/abhinavkuchhal7/` |
| YouTube | `https://www.youtube.com/@abhinavkuchhal` |
| LinkedIn | `https://www.linkedin.com/in/abhinav-kuchhal/` |

## Finder Content Reference

### Documents

- `Album` opens the images listed in `finderData.album`.
- `System Architecture Blueprint` opens the images listed in `finderData["system architecture blueprint"]`.
- To add or rename those files, edit `finderData` in `js/apps/finder.js`.

### Downloads

- Finder shows `installer.dmg` until purge state advances.
- After the purge state changes, Finder renders `PURGE` instead.

### Desktop

- Finder's desktop view mirrors the live `.desktop-icon` set.
- `My Socials` is a special-case mirror item with Finder-only opaque styling.

## Mail App Data Reference

Mail state lives in `js/mail.js`.

- `mailFolders` controls folder labels and whether unread counts affect the dock badge.
- `mailData` stores the message arrays for `inbox`, `important`, `spam`, and `deleted`.
- `renderMailApp()` redraws the tabs, list, detail pane, and badge.
- `setActiveMailFolder(folderId)` changes the current folder tab.
- `selectMail(mailId)` marks the message as read and renders the detail pane.

When adding mail content, append a message object to the correct folder inside `mailData`. The body may contain basic HTML like `<strong>` and `<br>`.

## Backend / API Reference

| Endpoint | File | Purpose |
|---|---|---|
| `GET /api/browser` | `api/browser.js` | Fetch and rewrite public web pages for the Internet window |
| `GET /api/guestbook` | `api/guestbook.js` | Fetch guestbook entries from Upstash Redis |
| `POST /api/guestbook` | `api/guestbook.js` | Create a guestbook entry |
| `DELETE /api/guestbook` | `api/guestbook.js` | Admin-only guestbook deletion |
| `GET /api/noticeboard` | `api/noticeboard.js` | Fetch notice posts |
| `POST /api/noticeboard` | `api/noticeboard.js` | Admin-only notice creation or updates |
| `GET /api/health` | `api/health.js` | Health check endpoint |

- Storage: Upstash Redis is the only shared persistence layer for Guestbook and Notice Board.
- Admin auth: admin actions require `X-Admin-Key` to match `ADMIN_SECRET_KEY`.
- Local dev: use relative `/api/...` calls from the frontend.
