# RetroOS — Design Tokens

## CSS Custom Properties

Defined in `:root` inside `css/main.css`:

```css
:root {
  --panel: #e9e4d5;
  --wallpaper: url("../assets/wallpapers/wallpaper1.webp");
  --file-icon-size: 60px;   /* Width and height of all desktop icons */
  --file-icon-size-sm: 40px;
}
```

> **Note:** `--file-icon-size` is `60px` (not 64px). The 64px value applies to the Android Folder box only.

---

## Icon Sizes

| Context | Size | Notes |
|---|---|---|
| Desktop icons | `60px` × `60px` (`--file-icon-size`) | All `.desktop-icon img` |
| Finder icons | `60px` × `60px` | `.finder-icon img` inherits same |
| Android Folder box | `64px` × `64px` | `.android-folder-box` — intentionally slightly larger |
| Android mini-grid thumbnails | `14px` × `14px` | Shown inside Android folder in Finder view |
| Android mini-grid thumbnails (desktop popup) | `22px` × `22px` | `.android-folder-grid img` in the expanded socials popup |
| Dock icons (inner image) | `~40px` | Set in dock CSS |
| Socials popup items | `56px` × `56px` | `.socials-popup-item img` |

---

## Colors

| Token | Value | Used For |
|---|---|---|
| Title bar bg | `#333333` | All window title bars |
| Close ctrl | `#ff5f57` | `.ctrl-close` background |
| Maximize ctrl | `#febc2e` | `.ctrl-max` background |
| Minimize ctrl | `#32cd32` | `.ctrl-min` background |
| Sidebar active | `#000000` | All sidebar active states (Finder, Mail, Projects) |
| Sidebar bg | `#e0e0e0` | Finder sidebar, Mail sidebar |
| Window panel | `#f0f0f0` | `--panel` variant, detail headers, compose footers |
| Blue accent | `#4a90e2` | Mail Send button only |
| Red alert | `#ff3b30` | Mail unread badge |
| White content | `#ffffff` | Main content areas in windows |
| Finder list | `#f7f7f7` | Email list / Finder file bg |
| Trash bg (revealed) | `#0d2a0d` | Dark earthy green for the Trash easter egg |
| Trash text | `#e0e0e0` | Off-white text inside Trash easter egg |
| Matrix green | `#32cd32` | `.highlight` inside Trash game, game-option borders |
| Sacrifice overlay | `rgba(80,0,0,0.7)` | Sacrifice ritual darkening overlay |

---

## Typography Scale

| Element | Font | Size |
|---|---|---|
| Window title | `VT323` | 20px (inherited) |
| Sidebar items | `VT323` | 18px |
| Email list sender | `VT323` | 17px |
| Email list subject | `VT323` | 14px |
| Email list preview | `VT323` | 13px |
| Email detail subject | `VT323` | 26px |
| Email body | `VT323` | 17px, line-height 1.7 |
| Desktop icon label | inherited from `main.css` | 15px, white with text-shadow |
| Dock labels | `VT323` | 11px |
| Terminal | `monospace` | 14px |
| Trash guardian text | `VT323` | 20px |
| Sacrifice glitch text | `VT323` | 48px |

---

## Spacing Patterns

| Pattern | Value |
|---|---|
| Window inner content padding | `15–18px` |
| Sidebar item padding | `12px 10px` |
| Email list item padding | `10px 12px` |
| Finder icon gap | `20px` (`.finder-main`) |
| Desktop icon column spacing | `100px` between top values |
| Button shadow (retro) | `5px 5px 0 rgba(0,0,0,0.9)` |
| Icon shadow (social) | `3px 3px 0 rgba(0,0,0,0.4)` |

---

## Border Conventions

| Context | Border Style |
|---|---|
| All main windows | `3px solid #000` |
| Sidebar divider | `2px solid #000` (right border) |
| Email list divider | `2px solid #000` (right border) |
| Item separators | `1px solid #ccc` (bottom border) |
| Detail pane header | `2px solid #000` (bottom border) |
| Compose footer | `2px solid #000` (top border) |
| Social icons on desktop | `2px solid #000` with `border-radius: 12px` |
| `.btn-retro` style | `3px solid #000` |
| Android Folder in Finder | `2px solid #999` (muted — grey on grey) |

---

## Z-Index Reference

| Layer | Z-Index | Notes |
|---|---|---|
| Normal windows | Managed by `zTop` counter | Increments on each `bringToFront` call |
| Skull on desktop | `9999` | `.skull-icon.skull-on-desktop` |
| Sacrifice overlay | `99999` | `#sacrifice-overlay` — covers everything |
| Boot screen | `99999` | `#boot-screen` — highest during startup |
| Mail notification | `10000` | `.mail-notification` toast |
| Menu popups | via `bringToFront` | `.menu` elements |
