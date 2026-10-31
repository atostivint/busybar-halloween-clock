import { request } from "./api";
import type { Settings } from "./settings";

/** The bar's fixed brightness (1-100), or null when it is on auto (no ambient reading is exposed). */
async function fixedBrightness(): Promise<number | null> {
  try {
    const n = Number(((await request("GET", "/display/brightness")) as { value?: unknown } | null)?.value);
    return isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}

/** Night mode: off, on, or auto = the fixed brightness at or below the limit, else the schedule when brightness is auto. */
export async function isNight(s: Settings, minuteOfDay: number): Promise<boolean> {
  if (s.nightMode === "off") return false;
  if (s.nightMode === "on") return true;
  const b = await fixedBrightness();
  if (b !== null) return b <= s.nightMaxBrightness;
  const from = s.nightFromMin;
  const to = s.nightToMin;
  if (from === to) return false;
  return from < to ? minuteOfDay >= from && minuteOfDay < to : minuteOfDay >= from || minuteOfDay < to;
}
