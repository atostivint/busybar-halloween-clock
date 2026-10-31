# Phase 0 findings (firmware 1.3.1, API 27.14.0)

Measured on a real BUSY Bar with throw-away spike apps (`tools/spikes/`).

| Question | Result |
|---|---|
| `Settings` global in the JS runtime | **Missing.** Read settings with `device.AppsSettingsGet({app_id})` (works, groups come back nested or flat: accept both). |
| `.anim` from the app package | `path: "animations/x.anim"` works. A file the firmware rejects shows a magenta box with an X at the top-left, and logs `[AnimFile] Error!`. |
| Multi-section `.anim` | Works **only if section 0 is `default` and spans every frame** (`anim_file_load_validate_section_0`). `tools/make_anim.py` now adds it. |
| Overlapping sections | **Work.** Section `t2` of a 40-frame file that covers frames 20-39 starts mid-way and plays to the end. Last frame stays on screen until the element is cleared or times out. |
| Package size | 4 MB and 12 MB packages stage and install (about 100 KB/s over Wi-Fi). Flash has 7 GB free. No practical limit for this app. |
| Brightness | `GET /display/brightness` returns `{"value":"auto"}` or the fixed level as a string (`"5"`). No ambient-light reading is exposed. |
| Time | `device.TimeGet().timestamp` = ISO with `+01:00` offset. |
| Logs | `console.error` lands in the device log under the app id. `POST /api/log_dump`, then `GET /api/storage/read?path=/ext/log.txt` (`tools/devlog.sh`). |
| Installing over a running app | `Cannot delete app` in the device log and the old code keeps running: `POST /api/apps/quit` first (`scripts/install.sh` does). |
| `DELETE /display/draw?application_name=` on an empty screen | HTTP 400 "not displaying anything": harmless. |
| busy-lib client | Reported error statuses as `TypeError: Expected a function`; the app uses raw `fetch` (`src/app/api.ts`) and sees the real status (409 "Not drawn due to low priority"). |
| Light sensor | The bar logs `Light sensor brightness: n` internally, but no endpoint exposes it, so night auto uses the fixed brightness or a schedule. |
| Priority | Another app (here: the manager's Python Halloween clock at priority 80) outranks priority 50. |

## Tooling gotchas (Windows)

- `busy-cli build` calls `tar`: run it from PowerShell (Windows bsdtar). Git Bash's GNU tar fails on `C:`.
- busy-cli 0.6 writes the font-map import paths with backslashes into generated JS, so a literal `font: "..."`
  anywhere in the source breaks the Windows build. The source uses shorthand `{ font }` (no colon) instead; this
  app draws raw elements and needs no font metrics.
- Node 24 required: `npx -p node@24 npm run build`. `~/.npmrc` `allow-scripts` breaks `npm run build`: point
  `NPM_CONFIG_USERCONFIG` at an empty file.
- The first animation draw after launch once threw `TypeError: Expected a function`; later ones were fine.

## Phase 2 (strike charge)

- Glyph ink measured on the bar (`tools/capture_glyphs.py`): digits 7 px wide (`1` is 4), colon 2, 1 px gap, ink top row 3. The
  per-character layout reproduces the old single centred element exactly.
- One fade `.anim` per glyph and clock colour (24 s at 10 fps) with overlapping sections `t0..t23`; after a redraw (new minute,
  a bat) the overlays are drawn with the section for the strike's age and the fade carries on with continuous colour.
- The glow overlay uses sections every 3 s so its 3 s breathing stays in phase with the scene redraw.
- Charge assets are about 1 MB raw (4 colours); the whole package is about 0.3 MB gzipped.
