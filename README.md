# Violet Glass

A floating violet glass skin for the [Video.js v10](https://videojs.org) player, made for the Video.js Skins Design Challenge.

## Design thinking

Violet Glass treats the controls as objects floating over the film: frosted violet glass, soft rim light and a neon magenta timeline. The glass is dark and blurred enough to stay readable over bright footage, and a scrim at the bottom of the frame helps too.

The layout follows the player's own width, not the window:

| Player width | Layout |
| --- | --- |
| 900px and up (desktop) | Full-width timeline on top. Volume and time on the left, back 10 / play / forward 10 in the middle, PiP, captions, settings and fullscreen on the right. |
| 480–899px (tablet) | Back / play / forward as large glass orbs over the picture, with a one-row pill dock: time, timeline, volume, captions, settings, fullscreen. |
| Under 480px (phone) | Smaller orbs (34/44px) and a slim two-row dock (about 54px) so most of the film stays visible. Icons are 18px but tap areas stay about 44px. Settings opens as a sheet over the picture. |

Settings holds speed, quality, subtitle language (every caption or subtitle track the video has, plus Off), loop and picture-in-picture. Interface labels follow the browser language (20 Video.js locales, with right-to-left layout for Arabic, Hebrew and Persian).

Fullscreen on Android rotates the phone to landscape and unlocks on exit (Video.js orientation lock). iPhone Safari has no element fullscreen or orientation lock API, so it uses the native iOS video player in fullscreen.

## Accessibility

- Every control is reachable by keyboard with a visible focus ring. Esc closes the menu, and the arrow keys move through it.
- Shortcuts: Space/K play, J/L or ←/→ seek, ↑/↓ volume, M mute, C captions, F fullscreen, I picture-in-picture, 0–9 jump.
- Touch targets are 44px on touch screens.
- Reduced motion, reduced transparency, increased contrast and forced colors are respected.
- Labels and announcements come from Video.js and are translated.

## Development

```sh
npm install
npm run dev        # local showcase
npm run typecheck
npm run build      # outputs dist/
```

## Project layout

```
index.html               showcase page
src/skin/skin.html       skin markup (Video.js v10 HTML components)
src/skin/skin.css        skin styles and responsive layouts
src/skin/skin.ts         component imports, icons, settings wiring, renderSkin()
src/skin/player.ts       <violet-player>: video features + orientation lock
src/skin/icons.ts        original SVG icon set
src/skin/styles/         Video.js scaffold base styles and theme tokens
src/showcase/            demo page script, styles and media list
```

Use the skin in any page:

```ts
import "@videojs/html/media/mux-video";
import { renderSkin } from "./src/skin/skin"; // also defines <violet-player>

const player = document.createElement("violet-player");
player.innerHTML = renderSkin('<mux-video src="https://stream.mux.com/PLAYBACK_ID.m3u8" playsinline></mux-video>');
document.body.append(player);
```

## Mux

Set `MUX_PLAYBACK_ID` in `src/showcase/media.ts`, or open the page with `?playbackId=YOUR_ID`. Your video becomes the first film.

## Deploy

Import the repository in Vercel (framework preset: Vite) or run `npm run deploy`.

## Credits

Video.js v10 and Mux. NASA Cosmic Dawn trailer. Big Buck Bunny © Blender Foundation, CC BY 3.0. DM Sans, SIL Open Font License. Skin source under the Apache License 2.0 (see LICENSE). Third-party footage is not relicensed.
