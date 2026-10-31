# Halloween Clock for the BUSY Bar

An orange clock over an animated night graveyard, running **on the bar itself** (a JerryScript app, no computer needed).

- **Random weather**: calm (stars), stormy (heavy clouds, thunder) or foggy (haze, ground mist, thunder).
- **Random moon**: full, half, crescent or blood. Weather and moon are re-rolled every hour by default.
- **Bats** cross the bar in front of the time; **lightning** flashes in stormy and foggy weather, plus a strike at every new hour.
- **Night mode** for low brightness: a hand-drawn, fully opaque pixel-art set (the firmware renders dim and mixed colours as pale dots at the lowest brightness).
- All animations are `.anim` files played by the firmware, so the app only talks to the bar once a minute and when an event fires.

## Install

1. Download `io.github.atostivint.hwclock-<version>.tgz` from the [latest release](../../releases/latest).
2. Open the bar's web UI (`http://<bar>.local`, or `http://10.0.4.20` over USB) -> **Apps** -> **Add app** -> **Select file**.
3. Launch **Halloween Clock** from the APPS menu.

Needs firmware 1.3.1 or newer (API 27.12). Or install from a terminal: `BAR=10.0.4.20 scripts/install.sh path/to/app.tgz`.

## Controls

| key | action |
|---|---|
| **OK** (knob click) | re-read the settings and roll new weather and moon |
| **START** | a bat and a lightning strike right now |
| **BACK** | quit |

## Settings

Web UI -> Apps -> Halloween Clock. Scene (weather, moon, re-roll interval), Clock (colour, 12-hour, draw priority),
Events (bat and thunder waits, lightning charge), Night mode (off, on, auto).

**Night auto** uses the bar's fixed brightness: night when it is at or below the limit (default 10 %). The bar exposes no
ambient-light reading, so when brightness is on *auto* the app falls back to a schedule (default 23:00 to 07:00).

The draw priority (default 50) must beat whatever else draws on the bar; an app at priority 80 will hide this one.

## Develop

Needs **Node 24** (Node 26 breaks the busy-cli build) and Python 3 for the asset tools.

```
npx -p node@24 npm install
npx -p node@24 npm run typecheck
npx -p node@24 npm run build          # dist/<id>.tgz   (on Windows run it from PowerShell: busy-cli shells out to tar)
BAR=10.0.4.20 scripts/install.sh      # quits the app, stages, installs, launches (curl; busy-cli app:install failed on firmware 1.3.1)
```

If `npm run build` fails with `EALLOWSCRIPTS`, point `NPM_CONFIG_USERCONFIG` at an empty file.

- `src/app/` the app: `clock.ts` (scheduler), `scene.ts`, `events.ts`, `roll.ts`, `night.ts`, `settings.ts`, `time.ts`, `api.ts`.
- `src/animations/` the generated `.anim` assets. Rebuild with `python tools/gen_graveyard.py` (about 2 minutes) and `python tools/gen_night.py`.
- `tools/screen.py`, `tools/png.py` capture the real screen; `tools/devlog.sh` prints the device log (the app's `console.error` shows up there).
- `docs/FINDINGS.md` what was measured on the bar (sections in `.anim`, size limits, brightness, quirks).

## Release

Bump `version` in `src/appmeta/manifest.json` and `package.json`, commit, tag the same version, push the tag.
`release.yml` builds the `.tgz` and attaches it to a GitHub release.
