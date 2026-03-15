# RetroOS — Design Philosophy

## Core Identity

RetroOS is a nostalgic tribute to classic desktop operating systems circa Mac OS 7-9. Every design decision should reinforce the feeling of using a chunky, physical computer interface instead of a modern web dashboard.

## The 3 Golden Rules

### 1. Retro First

If a design choice looks like a modern SaaS dashboard, it probably does not belong here.

- Good: pixel fonts, hard borders, flat fills, chunky shadows, deliberate utility panels
- Bad: pill buttons, soft cards, gradient-heavy controls, framework-default UI

### 2. Static Is Sacred

Windows and controls should feel solid.

- Good: hard-shadow buttons, discrete hover states, drag-based movement
- Bad: `transform: scale()` hover effects, breathing buttons, size-changing keyframes on normal controls

### 3. Organic Over Outsourced

Build the experience natively.

- Good: custom window manager, custom serverless APIs, custom browser proxy
- Bad: widget-style services or third-party replacements for core behavior

## Typography

| Context | Font | Notes |
|---|---|---|
| Primary UI text | `VT323` | Default for windows, lists, status, and forms |
| Numbers | `VT323` | Mandatory for clocks, counters, badges, and metrics |
| Accent labels | `Pixelify Sans` | Sparse decorative use only |
| Fallback | `monospace` | Never `sans-serif` |

VT323 reads best at relatively large sizes. Favor the 18px-28px range for core app text and go larger for titles.

## Color Direction

RetroOS is wallpaper-led, but the chrome stays grounded in blacks, grays, and warm neutral panels.

- Active and selected states stay black with white text.
- Mail and Internet may use warm parchment and yellow-green utility accents, but the controls should still feel retro and physical.
- Finder-safe versions of desktop exceptions such as `My Socials` should become opaque and practical when they enter light window surfaces.

## Window Chrome Rules

- Title bars use `#333333` with white text.
- Window borders stay heavy and black.
- Controls remain the red/yellow/green circle set.
- Calculator does not get a maximize button.

## The "My Socials" Exception

`My Socials` is the one intentionally non-retro desktop object.

- On the desktop it may use frosted glass and blur.
- In Finder it must switch to an opaque gray treatment with a visible border.
- The popup can keep the more modern glass treatment because it is intentionally a desktop-only flourish.

## App-Specific Guidance

### Mail

Mail is no longer a thin list-plus-pane clone. It now uses:

- warm beige sidebars and reader panels
- folder tabs that still keep hard borders and hard shadows
- chunky message cards instead of ultra-flat lists

Even with the softer palette, it should still read as a retro utility window, not a modern productivity app.

### Internet

The Internet window is allowed to feel slightly more "productized" than the rest of the OS because it is imitating a browser shell.

- Home view can use a parchment-like background and quick-link cards.
- The toolbar must still use retro borders and simple button states.
- Error and loading states should read like OS utility panels, not glossy web spinners.

### Guestbook And Notice Board

Loading panels, compose areas, and admin tools should feel like system dialogs:

- bordered
- shadowed
- text-first
- easy to read on both desktop and mobile

## Easter Eggs

The Trash and Sacrifice sequences are the deliberate visual exceptions that break normal desktop chrome.

### Trash

- Dark earthy green background
- Off-white copy with matrix-green highlights
- Strong terminal-like mood

### Sacrifice

- Full-screen ritual overlay
- Blood rain, glitch text, shake, and dramatic contrast
- Isolated from everyday UI styling

## Adding Or Redesigning An App

When improving an app, reuse the existing RetroOS language:

- black borders
- chunky shadows
- visible selection states
- large readable type
- direct layouts with minimal abstraction

If a surface starts looking like a generic modern web product, pull it back toward the OS metaphor.
