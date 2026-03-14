# RetroOS — Design Philosophy

## Core Identity

RetroOS is a **nostalgic tribute to classic desktop operating systems** (circa Mac OS 7–9).
Every design decision must reinforce the feeling of using a 1990s computer — not a modern SaaS app.

---

## The 3 Golden Rules

### 1. Retro First
If a design choice looks modern, it does not belong here.

✅ Pixel fonts, hard borders, flat backgrounds, chunky shadows  
❌ Gradients on interactive elements, rounded pill buttons, blur-heavy glass effects on non-folder elements, Material UI patterns

### 2. Static is Sacred
The interface elements should feel solid and physical, like real OS windows.

✅ `box-shadow: 5px 5px 0` hard pixel shadows  
✅ Discrete color changes on hover  
✅ Position-based movement (draggable windows)  
❌ `transform: scale()` pulsing or breathing  
❌ Keyframe animations that grow or shrink element sizes  
❌ Size-based micro-animations on buttons

### 3. Organic Over Outsourced
Build features natively. Avoid embedding third-party services.

✅ Custom Nodemailer backend for contact form  
✅ Native DOM window manager  
❌ Formspree, EmailJS, Netlify Forms  
❌ Widget-based embeds for core features

---

## Typography

| Context | Font | Notes |
|---|---|---|
| All UI text | `VT323` (Google Fonts) | Monospace pixel font — primary |
| Accent labels | `Pixelify Sans` | Sparingly — for stylistic labels |
| System font fallback | `monospace` | Never use `sans-serif` as fallback |

**Font sizes should feel big.** VT323 renders well at 16px–28px. Prefer 17–22px for body text.

---

## Colors

This is NOT a flat-design white/grey app. The desktop is wallpaper-driven with bold colors. UI chrome (windows, sidebars) uses greys and blacks to contrast.

- **Active/selected state:** Always `background: #000; color: #fff` — no blue highlights in the retro sections.
- **Blue accent (#4a90e2):** Only acceptable for the Send button in Mail and link-type actions.
- **Window panels:** `#f0f0f0` or `#e0e0e0` for header areas, `#fff` for content areas.

---

## Window Chrome Rules

- Every window has a **dark title bar** (`background: #333333`) with white text.
- Controls are circles: 🔴 close (`#ff5f57`), 🟡 maximize (`#febc2e`), 🟢 minimize (`#32cd32`).
- The maximize button uses **Arial Bold** with the character `O` — NOT the VT323 font, NOT the `#` symbol.
- The Calculator window has **no maximize button**.

---

## The "Android Folder" Exception

The "My Socials" folder on the desktop is intentionally modern-looking — it is an **Android-inspired frosted-glass folder** and is the one allowed exception to the retro-first rule.

- On the **desktop** (colorful wallpaper): `background: rgba(255,255,255,0.25); backdrop-filter: blur(8px)` — translucent.
- In the **Finder** (white background): `background: #e0e0e0; border: 2px solid #999` — opaque grey so it remains visible.
- The popup it opens uses `backdrop-filter: blur(20px)` with a dark dim overlay.

---

## Easter Egg Design Philosophy

There are two interactive easter eggs. Each has its own distinct visual identity designed to break from the normal retro chrome:

### Trash Easter Egg (Morphy the Dog)
- Background: `#0d2a0d` (dark earthy green)
- Text color: `#e0e0e0` (off-white) + matrix green `#32cd32` for highlights
- Buttons use matrix-green borders with transparent backgrounds (hover fills green)
- Animations: `dramaticReveal` on enter, `blink` cursor for typewriter effect
- Dog state is tracked in `trashState` object — conversation progresses through stages: `initial → petted → questioning → pills → final`
- The skull (`dead_dog.webp`) is draggable after the dog dies — can be dragged onto `SACRIFICE.exe`

### Sacrifice Ritual Easter Egg
- Triggered by dragging skull onto `SACRIFICE.exe` icon in Finder > Downloads
- Uses a full-screen `#sacrifice-overlay` div with blood rain, vignette, glitch text
- The `body.sacrifice-shake` class applies `sacrificeShake` keyframe animation (a rare allowed scale/translate exception since it's the big finale)
- Styles live in `css/sacrifice.css`, logic in `js/apps/sacrifice.js`

---

## What "Improvement" Means for App UIs

When redesigning or improving an app's UI, draw inspiration from `css/projects.css` — it defines the visual language for two-pane windows:

- **Sidebar:** grey `#e0e0e0`, active = `#000` bg with white text, item separators = `1px solid #ccc`
- **Buttons:** `border: 3px solid #000; box-shadow: 5px 5px 0 rgba(0,0,0,0.9)` — the `.btn-retro` pattern
- **Content pane headers:** `background: #f0f0f0; border-bottom: 2px solid #000`

This exact pattern was used to redesign the Mail app UI — the result is in `css/mail.css`.

---

## How to Add a New App

Follow this exact pattern every time:

1. **HTML:** Add the window `<div id="myapp" class="window">` in `index.html`.
2. **CSS:** Create `css/myapp.css` with all app-specific styles. Add a `<link>` to it in `index.html`.
3. **JS:** Create `js/apps/myapp.js` with all app logic. Add a `<script defer>` to it in `index.html`.
4. **Open hook:** Add `'myapp'` to the `openWindow()` function's app-initializer section in `system.js` if the app needs to run setup code when first opened.
5. **Dock icon (if needed):** Add a `<div class="dock-icon">` in the dock nav in `index.html`.
6. **Desktop icon (if needed):** Add a `<div class="desktop-icon">` on the desktop in `index.html`.
