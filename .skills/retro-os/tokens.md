# RetroOS — Design Tokens

## CSS Custom Properties

Defined in `:root` inside `css/main.css`:

```css
:root {
  --panel: #e9e4d5;
  --wallpaper: url("../assets/wallpapers/wallpaper1.webp");
  --file-icon-size: 60px;
  --file-icon-size-sm: 40px;
}
```

`--file-icon-size` is `60px`. The `64px` size applies only to the Android-style socials folder box.

## Icon Sizes

| Context | Size | Notes |
|---|---|---|
| Desktop icons | `60px x 60px` | `.desktop-icon img` |
| Finder icons | `60px x 60px` | Standard Finder item images |
| Android folder box | `64px x 64px` | Desktop and Finder socials folder shell |
| Finder socials mini-grid icons | `14px x 14px` | Inside Finder-safe socials folder |
| Socials popup icons | `56px x 56px` | Expanded popup links |
| Dock inner icons | about `40px` | Shared dock styling |

## Core Colors

| Token | Value | Used For |
|---|---|---|
| Title bar | `#333333` | Window title bars |
| Close control | `#ff5f57` | `.ctrl-close` |
| Maximize control | `#febc2e` | `.ctrl-max` |
| Minimize control | `#32cd32` | `.ctrl-min` |
| Active state | `#000000` | Selected icons, Finder sidebar, active list items |
| Shared panel gray | `#f0f0f0` / `#e0e0e0` | Shared window chrome |
| Mail accent | `#e2c75d` | Active mail tabs, unread markers |
| Mail accent soft | `#f7e7a2` | Highlighted mail body text |
| Mail sidebar | `#e7dcc1` | Mail folder column |
| Mail card | `#fff9ec` | Mail list items |
| Mail reader bg | `#fffdf5` | Mail detail pane |
| Internet shell bg | `#f3eedf` | Internet home and loading shell |
| Internet toolbar | `#d9d9d9` | Internet top controls |
| Retro green | `#32cd32` | Internet Go button, loader sweeps, trash highlights |
| Notice warning | `#ff3b30` | Notice warning tag |
| Notice announce | `#febc2e` | Notice announce tag |
| Notice update | `#4a90e2` | Notice update tag |
| Trash bg | `#0d2a0d` | Trash easter egg |
| Trash text | `#e0e0e0` | Trash copy |
| Sacrifice overlay | `rgba(80,0,0,0.7)` | Sacrifice ritual overlay |

## Typography Scale

| Element | Font | Size |
|---|---|---|
| Window title | `VT323` | about `20px` |
| Finder sidebar items | `VT323` | about `18px` |
| Mail list sender | `VT323` | `22px` |
| Mail list subject | `VT323` | `18px` |
| Mail list date | `VT323` | `18px` |
| Mail detail subject | `VT323` | `31px` |
| Mail detail body | `VT323` | `22px` |
| Desktop icon labels | `VT323` | about `15px` |
| Dock labels | `VT323` | about `11px` |
| Terminal | `monospace` | about `14px` |
| Loader titles | `VT323` | `24px` |
| Sacrifice glitch text | `VT323` | `48px` |

## Spacing Patterns

| Pattern | Value |
|---|---|
| Shared window content padding | `15px-24px` depending on app |
| Finder icon gap | `20px` |
| Finder icon padding | `6px 4px` |
| Mail tab gap | `10px` |
| Mail list item padding | `12px 14px 12px 22px` |
| Guestbook and Notice loader panel padding | about `18px` |
| Retro button shadow | `5px 5px 0 rgba(0,0,0,0.9)` |
| Secondary button shadow | `3px 3px 0 rgba(0,0,0,0.8)` |

## Border Conventions

| Context | Border Style |
|---|---|
| Main windows | `3px solid #000` |
| Mail sidebar divider | `3px solid #000` |
| Mail detail header | `3px solid #000` |
| Retro buttons | `3px solid #000` |
| Finder socials folder | `2px solid #999` |
| Social icons | `2px solid #000` with `border-radius: 12px` |
| Loader tracks | `2px solid #000` |

## Z-Index Reference

| Layer | Z-Index | Notes |
|---|---|---|
| Normal windows | managed by `zTop` | Raised through `bringToFront()` |
| Skull on desktop | `9999` | Trash easter egg |
| Boot screen | `99999` | Startup overlay |
| Sacrifice overlay | `99999` | Full-screen ritual layer |
| Menus and popups | raised dynamically | Shared popup behavior |
