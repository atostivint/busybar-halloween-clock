import type { Moon, Weather } from "./settings";

export type El = Record<string, unknown>;

export interface World {
  weather: Weather;
  moon: Moon;
}

const anim = (name: string): string => "animations/" + name + ".anim";

/** Looping layers, bottom to top. Night mode uses the opaque hand-drawn set (no moon rim, no mist). */
export function layers(world: World, night: boolean): El[] {
  const pre = night ? "night_" : "";
  const names: [string, string][] = [
    ["moon", pre + "moon_" + world.moon],
    ["sky", pre + "sky_" + world.weather],
  ];
  if (!night) names.push(["moonrim", "moonrim_" + world.moon]);
  names.push(["scenery", pre + "scenery"]);
  if (world.weather === "foggy" && !night) names.push(["mist", "mist_foggy"]);
  return names.map(([id, file]) => ({ id, type: "animation", path: anim(file), x: 0, y: 0, loop: true }));
}

const BATS = ["bat_lr_high", "bat_rl_high", "bat_lr_low", "bat_rl_low"];
export const BAT_SECONDS = 3; // one-shot lengths; the element timeouts add headroom for the file load
export const THUNDER_SECONDS = 0.8;

export function batElement(night: boolean): El {
  const file = (night ? "night_" : "") + BATS[Math.floor(Math.random() * BATS.length)];
  return { id: "bat", type: "animation", path: anim(file), x: 0, y: 0, loop: false, timeout: BAT_SECONDS + 2 };
}

export function thunderElement(night: boolean): El {
  return {
    id: "thunder", type: "animation", path: anim(night ? "night_thunder" : "thunder"),
    x: 0, y: 0, loop: false, timeout: THUNDER_SECONDS + 1.5,
  };
}

// Shorthand property on purpose: a literal `font: "..."` breaks busy-cli 0.6 builds on Windows (see docs/FINDINGS.md).
const font = "extra_large";

export function timeElement(text: string, color: string): El {
  return { id: "time", type: "text", text, font, color, x: 36, y: 8, align: "center" };
}

/**
 * The whole scene, bottom to top. A draw replaces what the bar had and an element sent alone ends up
 * behind the others, so layers, time and one-shot events always go out together, events last.
 */
export function sceneElements(world: World, night: boolean, text: string, color: string, events: El[]): El[] {
  return [...layers(world, night), timeElement(text, color), ...events];
}
