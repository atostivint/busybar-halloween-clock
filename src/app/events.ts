import { THUNDER_WEATHER } from "./roll";
import { batElement, thunderElement, type El, type World } from "./scene";
import type { Settings } from "./settings";

/** Random one-shot events: bat flights, thunder, and a strike at every new hour (stormy and foggy). */
export interface EventState {
  nextBat: number | null; // Date.now() ms, null = disabled
  nextThunder: number | null;
  hourStrikeAt: number | null;
}

const wait = (lo: number, hi: number, now: number, scale = 1): number | null =>
  hi > 0 ? now + 1000 * scale * (lo + Math.random() * Math.max(0, hi - lo)) : null;

export function newEvents(): EventState {
  return { nextBat: null, nextThunder: null, hourStrikeAt: null };
}

/** (Re)start the random waits, e.g. after a new weather roll or a settings change. */
export function reschedule(ev: EventState, s: Settings, world: World, now: number): void {
  const scale = THUNDER_WEATHER[world.weather];
  ev.nextBat = wait(s.batMin, s.batMax, now);
  ev.nextThunder = scale ? wait(s.thunderMin, s.thunderMax, now, scale) : null;
  ev.hourStrikeAt = null;
}

/** A new hour started: lightning charges the clock 1.5 s later (stormy and foggy only). */
export function armHourStrike(ev: EventState, world: World, now: number): void {
  if (THUNDER_WEATHER[world.weather] && ev.nextThunder !== null) ev.hourStrikeAt = now + 1500;
}

export interface Fired {
  elements: El[];
  strike: boolean;
}

/** Events that are due at `now`; their next waits are drawn here. */
export function collect(ev: EventState, s: Settings, world: World, night: boolean, now: number): Fired {
  const elements: El[] = [];
  if (ev.nextBat !== null && now >= ev.nextBat) {
    elements.push(batElement(night));
    ev.nextBat = wait(s.batMin, s.batMax, now);
  }
  let strike = false;
  if (ev.hourStrikeAt !== null && now >= ev.hourStrikeAt) {
    strike = true;
    ev.hourStrikeAt = null;
  } else if (ev.nextThunder !== null && now >= ev.nextThunder) {
    strike = true;
  }
  if (strike) {
    elements.push(thunderElement(night));
    ev.nextThunder = wait(s.thunderMin, s.thunderMax, now, THUNDER_WEATHER[world.weather] || 1);
  }
  return { elements, strike };
}

/** Milliseconds until the earliest pending event (null when none). */
export function nextDue(ev: EventState): number | null {
  let best: number | null = null;
  for (const t of [ev.nextBat, ev.nextThunder, ev.hourStrikeAt]) if (t !== null && (best === null || t < best)) best = t;
  return best;
}
