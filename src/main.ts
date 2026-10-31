import { startClock } from "./app/clock";

/**
 * Halloween clock. main() runs once; the app lives while the clock timer and the input listener are pending.
 * Back (short) quits: the timer is cleared and the listener unbound. OK (knob click) rolls new weather and moon,
 * START shows a bat and a lightning strike.
 */
function main(): void {
  const clock = startClock();
  const unbind = listen("input", (event) => {
    if (event.key === "back" && event.action === "short") {
      clock.stop();
      setTimeout(unbind, 0);
    } else if (event.key === "ok" && event.action === "short") {
      clock.reroll();
    } else if (event.key === "start" && event.action === "short") {
      clock.showOff();
    }
  });
}

main();
