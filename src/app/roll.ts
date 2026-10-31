import { MOONS, WEATHERS, type Settings } from "./settings";
import type { World } from "./scene";

/** Thunder only in these weathers; the value scales the waits (foggy: rarer). */
export const THUNDER_WEATHER: Record<string, number> = { stormy: 1, foggy: 2 };

const choice = <T>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)];

/** Weather and moon: random unless fixed in the settings. */
export function roll(s: Settings): World {
  return {
    weather: s.weather === "random" ? choice(WEATHERS) : s.weather,
    moon: s.moon === "random" ? choice(MOONS) : s.moon,
  };
}

/** True when the settings leave something to roll, i.e. a re-roll every few minutes makes sense. */
export const rerolls = (s: Settings): boolean => s.rerollMin > 0 && (s.weather === "random" || s.moon === "random");
