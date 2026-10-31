import { GAP, GLYPHS, INK_TOP } from "./glyphs";
import type { El } from "./scene";

// Shorthand property on purpose: a literal `font: "..."` breaks busy-cli 0.6 builds on Windows (see docs/FINDINGS.md).
const font = "extra_large";

/** One clock character: its text element origin (x, y) and where its ink starts (ix, iy). */
export interface Placed {
  ch: string;
  x: number;
  y: number;
  ix: number;
  iy: number;
}

/**
 * The time as one text element per character, so the lightning charge can lay a glyph-shaped fade over each one.
 * Ink is packed with the font's own gap and centred on x = 36, which is where the single centred text element
 * used to put it (digits stay proportional: a "1" is narrower).
 */
export function layoutTime(text: string): Placed[] {
  let total = GAP * (text.length - 1);
  for (let i = 0; i < text.length; i++) total += GLYPHS[text.charAt(i)][2];
  let ix = Math.round(36 - total / 2);
  const y = INK_TOP - GLYPHS["0"][1];
  const placed: Placed[] = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text.charAt(i);
    const g = GLYPHS[ch];
    placed.push({ ch, x: ix - g[0], y, ix, iy: y + g[1] });
    ix += g[2] + GAP;
  }
  return placed;
}

/** Ids count from the right, so the minutes digits keep theirs when an hour digit appears or goes. */
export function timeElements(placed: Placed[], color: string): El[] {
  return placed.map((p, i) => ({ id: "t" + (placed.length - 1 - i), type: "text", text: p.ch, font, color, x: p.x, y: p.y }));
}
