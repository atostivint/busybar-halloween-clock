import { GLOW, PRESET_RGB } from "./glyphs";
import type { Placed } from "./layout";
import type { El } from "./scene";

/** A lightning strike turns the clock green; it fades back to its colour over this long (24 s, see tools/charge_model.py). */
export const CHARGE_MS = 24000;
const FLASH: Rgb = [170, 255, 190];
const GAP: Rgb = [0, 110, 12];

export type Rgb = [number, number, number];
export interface Charge {
  startedAt: number; // Date.now() ms
}

function fadeU(t: number): number {
  const k = t / (CHARGE_MS / 1000);
  if (k < 0.2) return 0;
  const u = Math.min(1, (k - 0.2) / 0.8);
  return u * u * (3 - 2 * u);
}

function toHsv(r: number, g: number, b: number): Rgb {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  let h = 0;
  if (d > 0) {
    if (max === r) h = ((g - b) / d + 6) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [h, max === 0 ? 0 : d / max, max];
}

function fromHsv(h: number, s: number, v: number): Rgb {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  const m = i % 6;
  const rgb = m === 0 ? [v, t, p] : m === 1 ? [q, v, p] : m === 2 ? [p, v, t] : m === 3 ? [p, q, v] : m === 4 ? [t, p, v] : [v, p, q];
  return [Math.round(rgb[0] * 255), Math.round(rgb[1] * 255), Math.round(rgb[2] * 255)];
}

/** Mirror of charge_color() in tools/charge_model.py: the colour the fade has reached t seconds after the strike. */
export function chargeColor(t: number, target: Rgb): Rgb {
  if (t < 0.1 || (t >= 0.2 && t < 0.4)) return FLASH;
  if (t < 0.2) return GAP;
  const green = 125 / 360;
  const [h0, s0, v0] = toHsv(target[0], target[1], target[2]);
  const u = fadeU(t);
  return fromHsv(green + (h0 - green) * u, 1 + (s0 - 1) * u, 1 + (v0 - 1) * u);
}

export function hex(rgb: Rgb): string {
  let out = "#";
  for (let i = 0; i < 3; i++) out += (rgb[i] < 16 ? "0" : "") + rgb[i].toString(16).toUpperCase();
  return out + "FF";
}

export const presetRgb = (preset: string): Rgb => PRESET_RGB[preset] || PRESET_RGB.orange;

/** What a redraw adds while the clock is charged. */
export interface Overlay {
  color: string; // the time text, in the colour the fade has reached
  glow: El[];
  digits: El[];
}

/** The charge in progress, resumed at the section that matches its age; null once it is over (or about to be). */
export function chargeOverlay(charge: Charge, placed: Placed[], preset: string, night: boolean, now: number): Overlay | null {
  const elapsed = (now - charge.startedAt) / 1000;
  const left = CHARGE_MS / 1000 - elapsed;
  if (left < 1) return null;
  const k = Math.max(0, Math.min(23, Math.floor(elapsed)));
  const timeout = left + 2;
  const digits: El[] = placed.map((p, i) => ({
    id: "c" + (placed.length - 1 - i), type: "animation",
    path: "animations/charge_" + preset + "_" + (p.ch === ":" ? "c" : p.ch) + ".anim",
    x: p.ix, y: p.iy, loop: false, section: "t" + k, timeout,
  }));
  const glow: El[] = night ? [] : [{
    id: "glowcharge", type: "animation", path: "animations/glowcharge.anim", x: GLOW.x, y: GLOW.y,
    loop: false, section: "g" + Math.max(0, Math.min(7, Math.floor(elapsed / 3))), timeout,
  }];
  return { color: hex(chargeColor(elapsed, presetRgb(preset))), glow, digits };
}
