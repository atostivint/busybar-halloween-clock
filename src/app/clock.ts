import { APP, clearScreen, send } from "./draw";
import { armHourStrike, collect, newEvents, nextDue, reschedule } from "./events";
import { isNight } from "./night";
import { rerolls, roll } from "./roll";
import { chargeOverlay, hex, presetRgb, type Charge } from "./charge";
import { layoutTime, timeElements } from "./layout";
import { batElement, sceneElements, thunderElement, type El, type World } from "./scene";
import { DEFAULTS, loadSettings, type Settings } from "./settings";
import { clockText, minuteOfDay, msToNextMinute, syncClock } from "./time";

const RESYNC_MINUTES = 10; // re-read the bar's time (and its zone) this often

export interface Clock {
  stop(): void;
  /** Re-read the settings and roll new random weather and moon right now. */
  reroll(): void;
  /** A bat and a lightning strike right now. */
  showOff(): void;
}

/**
 * The whole app: one timer, armed for the earliest of the next minute and the next random event.
 * Every minute change redraws all elements (settings and brightness are re-read first); every event
 * is drawn together with the whole scene, last. The animations are looped by the bar's firmware.
 */
export function startClock(): Clock {
  let settings: Settings = DEFAULTS;
  let world: World | null = null;
  let night = false;
  let shown: string | null = null;
  let rolledAt = 0;
  let minutes = 0;
  let evKey = "";
  let stopped = false;
  let busy = false;
  let again = false;
  let full = true;
  let refresh = false; // re-read settings and brightness now (OK pressed)
  let forceRoll = false;
  let failures = 0;
  let manual: El[] = [];
  let manualStrike = false;
  let charge: Charge | null = null; // the clock is charged by lightning and fading back
  let timer: ReturnType<typeof setTimeout> | null = null;
  const events = newEvents();

  function arm(ms: number): void {
    if (stopped) return;
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      void tick().catch((err) => console.error(APP + ": tick: " + String(err)));
    }, Math.max(200, ms));
  }

  function rollNow(now: number): void {
    world = roll(settings);
    rolledAt = now;
    reschedule(events, settings, world, now);
    full = true;
    console.error(APP + ": weather " + world.weather + ", moon " + world.moon);
  }

  async function tick(): Promise<void> {
    if (stopped) return;
    if (busy) {
      again = true;
      return;
    }
    busy = true;
    try {
      let now = Date.now();
      if (shown === null || refresh || clockText(settings.hour12) !== shown) {
        refresh = false;
        if (shown === null) await clearScreen(); // whatever a previous run left on the bar
        if (shown === null || ++minutes % RESYNC_MINUTES === 0) await syncClock();
        settings = await loadSettings();
        const wasNight = night;
        night = await isNight(settings, minuteOfDay());
        if (night !== wasNight) full = true;
        now = Date.now();
        const fixedChanged =
          world !== null && ((settings.weather !== "random" && settings.weather !== world.weather) ||
            (settings.moon !== "random" && settings.moon !== world.moon));
        const rerollDue = forceRoll || (rerolls(settings) && now - rolledAt >= settings.rerollMin * 60000);
        forceRoll = false;
        if (world === null || fixedChanged || rerollDue) rollNow(now);
        const key = [settings.batMin, settings.batMax, settings.thunderMin, settings.thunderMax].join();
        if (key !== evKey && world !== null) {
          evKey = key;
          reschedule(events, settings, world, now);
        }
        const text = clockText(settings.hour12);
        if (shown !== null && text.endsWith(":00") && world !== null) armHourStrike(events, world, now);
        shown = text;
        full = true;
      }
      if (world !== null && shown !== null) {
        const fired = collect(events, settings, world, night, Date.now());
        const extra = fired.elements.concat(manual);
        if ((fired.strike || manualStrike) && settings.strikeCharge) charge = { startedAt: Date.now() };
        manual = [];
        manualStrike = false;
        if (full || extra.length > 0) {
          const placed = layoutTime(shown);
          const overlay = charge !== null ? chargeOverlay(charge, placed, settings.color, night, Date.now()) : null;
          if (overlay === null) charge = null;
          const color = overlay !== null ? overlay.color : hex(presetRgb(settings.color));
          await send(
            sceneElements(world, night, overlay ? overlay.glow : [], timeElements(placed, color), overlay ? overlay.digits : [], extra),
            settings.priority,
          );
          full = false;
        }
      }
      failures = 0;
    } catch (err) {
      full = true; // the screen state is unknown: resend everything next time
      failures++;
      if (failures === 1 || failures % 10 === 0) console.error(APP + ": " + String(err) + " (attempt " + failures + ")");
    } finally {
      busy = false;
    }
    if (stopped) return;
    if (failures > 0) return arm(Math.min(60000, 3000 * failures));
    const due = nextDue(events);
    const toEvent = due === null ? 60000 : due - Date.now();
    arm(again ? 200 : Math.min(msToNextMinute() + 300, toEvent));
    again = false;
  }

  void tick().catch((err) => console.error(APP + ": start: " + String(err)));

  return {
    stop(): void {
      stopped = true;
      if (timer !== null) clearTimeout(timer);
      timer = null;
      void clearScreen();
    },
    reroll(): void {
      refresh = true;
      forceRoll = true;
      arm(0);
    },
    showOff(): void {
      manual = [batElement(night), thunderElement(night)];
      manualStrike = true;
      arm(0);
    },
  };
}
