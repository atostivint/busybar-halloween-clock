import { request } from "./api";

// The bar's wall-clock time is read from the device and advanced with Date.now() deltas. Date's own
// time zone is never used: the wall-clock fields are kept as a "naive" UTC date and read with getUTC*().
let baseNaive = 0;
let baseTick = 0;
let synced = false;

export async function syncClock(): Promise<void> {
  const stamp = String(((await request("GET", "/time")) as { timestamp?: unknown } | null)?.timestamp); // 2026-10-31T22:26:03+01:00
  const m = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)/.exec(stamp);
  if (!m) throw new Error("bad time " + stamp);
  baseNaive = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
  baseTick = Date.now();
  synced = true;
}

export const clockSynced = (): boolean => synced;

function local(): Date {
  return new Date(baseNaive + (Date.now() - baseTick));
}

export function minuteOfDay(): number {
  const d = local();
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

export function clockText(hour12: boolean): string {
  const d = local();
  const h = d.getUTCHours();
  const mm = d.getUTCMinutes();
  const hh = hour12 ? h % 12 || 12 : h;
  return (hour12 || hh > 9 ? "" : "0") + hh + ":" + (mm < 10 ? "0" : "") + mm;
}

/** Milliseconds until the wall clock's next minute starts. */
export function msToNextMinute(): number {
  const d = local();
  return 60000 - (d.getUTCSeconds() * 1000 + d.getUTCMilliseconds());
}
