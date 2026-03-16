# RetroOS

RetroOS is a handcrafted single-page operating system sandbox that recreates a retro desktop operating system in the browser with vanilla HTML, CSS, and JavaScript. The app combines draggable windows, a Finder-style file browser, a stateful terminal shell, an in-app web browser, lore-heavy mail, and Redis-backed community apps without introducing a framework.

![Desktop Overview](assets/screenshots/Demo1.png)

## Highlights

- Window manager with drag, minimize, maximize, z-index stacking, and template-cloned windows.
- Finder that mirrors desktop icons, renders album and blueprint folders, and shares the same icon action router as the desktop.
- Terminal with a command registry, history, virtual filesystem, project shortcuts, mail access, theme controls, and Matrix mode.
- Internet window with a Snoogle home screen, quick links, back navigation, and a sanitized `/api/browser` proxy for in-app browsing.
- Mail app with `Inbox`, `Important`, `Spam`, and `Deleted` folders plus an unread dock badge.
- Guestbook and Notice Board backed by Upstash Redis, including retro loading states and guestbook emoji insertion.
- Settings window for built-in wallpapers, classic grayscale mode, and custom wallpaper uploads.

![Licences and System Info](assets/screenshots/Licences.png)

## Stack

- Frontend: vanilla HTML, CSS, and JavaScript.
- Backend: Vercel serverless functions in `api/`.
- Persistence: Upstash Redis for Guestbook and Notice Board data.
- Local mail backend: Express/Nodemailer service in `server/`.
- Typography: `VT323` for primary UI text and numbers, `Pixelify Sans` for limited accent use.

## Project Structure

- `index.html`: desktop icons, dock, windows, templates, and static app markup.
- `js/system.js`: window manager, icon activation routing, photo viewer helpers, social popup helpers.
- `js/main.js`: boot sequence and app initialization.
- `js/mail.js`: foldered mail data, selection state, and badge rendering.
- `js/apps/finder.js`: Finder navigation, folder rendering, and Finder icon interaction binding.
- `js/apps/terminal.js`: RetroOS shell, virtual filesystem, command execution, and app bridges.
- `js/apps/internet.js`: Snoogle home/search state, iframe navigation, and browser history.
- `api/browser.js`: sanitized HTML proxy used by the Internet window.
- `css/<app>.css`: one stylesheet per app or concern, including `css/settings.css`.

## Contribution Notes

RetroOS is intentionally framework-free. If you contribute:

- keep app-specific CSS out of `css/main.css`
- keep one JS file per concern
- route window lifecycle changes through `js/system.js`
- preserve the retro visual language before adding new capability

Check the repo notes in `.skills/retro-os/` before changing architecture or design patterns.

## Screenshots

![Music and Apps](assets/screenshots/Demo2.png)

## Contact

- Live Sandbox: [abhinavkuchhal.com](https://abhinavkuchhal.com)
- GitHub: [@JustPratiyush](https://github.com/JustPratiyush)
- X: [@JustPratiyush](https://x.com/JustPratiyush)
- Instagram: [@abhinavkuchhal7](https://www.instagram.com/abhinavkuchhal7/)
- LinkedIn: [abhinav-kuchhal](https://www.linkedin.com/in/abhinav-kuchhal/)

Inspired by classic operating systems. This project is a creative tribute and is not affiliated with Apple Inc.
