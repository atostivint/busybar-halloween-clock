import { APP, request } from "./api";
import { loadValues, type SettingsValues } from "@shared/settings";

export const WEATHERS = ["calm", "stormy", "foggy"] as const;
export const MOONS = ["full", "half", "crescent", "blood"] as const;
export type Weather = (typeof WEATHERS)[number];
export type Moon = (typeof MOONS)[number];
export type NightMode = "off" | "on" | "auto";

export interface Settings {
  weather: Weather | "random";
  moon: Moon | "random";
  rerollMin: number;
  color: string;
  hour12: boolean;
  priority: number;
  batMin: number;
  batMax: number;
  thunderMin: number;
  thunderMax: number;
  strikeCharge: boolean;
  nightMode: NightMode;
  nightMaxBrightness: number;
  nightFromMin: number; // minutes after midnight
  nightToMin: number;
}

export const DEFAULTS: Settings = {
  weather: "random", moon: "random", rerollMin: 60, color: "#FF7A00FF", hour12: false, priority: 50,
  batMin: 20, batMax: 60, thunderMin: 30, thunderMax: 120, strikeCharge: true,
  nightMode: "off", nightMaxBrightness: 10, nightFromMin: 23 * 60, nightToMin: 7 * 60,
};

type Bag = Record<string, unknown>;

/** A field from its group (nested, as the API returns it) or at the top level (flat). */
function pick(values: Bag, group: string, key: string): unknown {
  const g = values[group];
  if (g && typeof g === "object" && key in (g as Bag)) return (g as Bag)[key];
  return values[key];
}

function int(v: unknown, def: number, lo: number, hi: number): number {
  const n = typeof v === "number" ? v : Number(v);
  return typeof v !== "boolean" && v !== null && v !== "" && isFinite(n) ? Math.max(lo, Math.min(hi, Math.round(n))) : def;
}

function oneOf<T extends string>(v: unknown, allowed: readonly T[], def: T): T {
  for (let i = 0; i < allowed.length; i++) if (allowed[i] === v) return allowed[i];
  return def;
}

function hhmm(v: unknown, def: number): number {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(v));
  return m ? Math.min(23, +m[1]) * 60 + Math.min(59, +m[2]) : def;
}

function colour(v: unknown, def: string): string {
  const m = /^#?([0-9a-fA-F]{6})([0-9a-fA-F]{2})?$/.exec(String(v));
  return m ? "#" + (m[1] + (m[2] || "FF")).toUpperCase() : def;
}

export function parseSettings(values: SettingsValues | null): Settings {
  const v = (values || {}) as Bag;
  const d = DEFAULTS;
  return {
    weather: oneOf(pick(v, "scene", "weather"), ["random", ...WEATHERS] as const, d.weather),
    moon: oneOf(pick(v, "scene", "moon"), ["random", ...MOONS] as const, d.moon),
    rerollMin: int(pick(v, "scene", "reroll_min"), d.rerollMin, 0, 240),
    color: colour(pick(v, "clock", "time_color"), d.color),
    hour12: pick(v, "clock", "hour12") === true,
    priority: int(pick(v, "clock", "priority"), d.priority, 1, 100),
    batMin: int(pick(v, "events", "bat_min"), d.batMin, 1, 600),
    batMax: int(pick(v, "events", "bat_max"), d.batMax, 0, 600),
    thunderMin: int(pick(v, "events", "thunder_min"), d.thunderMin, 1, 900),
    thunderMax: int(pick(v, "events", "thunder_max"), d.thunderMax, 0, 900),
    strikeCharge: pick(v, "events", "strike_charge") !== false,
    nightMode: oneOf(pick(v, "night", "mode"), ["off", "on", "auto"] as const, d.nightMode),
    nightMaxBrightness: int(pick(v, "night", "max_brightness"), d.nightMaxBrightness, 1, 100),
    nightFromMin: hhmm(pick(v, "night", "from"), d.nightFromMin),
    nightToMin: hhmm(pick(v, "night", "to"), d.nightToMin),
  };
}

/** Settings from the `Settings` global when the firmware has it, else over HTTP; defaults when neither works. */
export async function loadSettings(): Promise<Settings> {
  let values = await loadValues();
  if (!values) {
    try {
      values = ((await request("GET", "/apps/settings?app_id=" + APP)) as { values?: SettingsValues } | null)?.values ?? null;
    } catch (err) {
      console.error(APP + ": settings unavailable: " + String(err));
    }
  }
  return parseSettings(values);
}
