// PHASE 0 SPIKE - not the real app.
import { device } from "@shared/device";
import manifest from "./appmeta/manifest.json";
import moon from "./animations/moon_full.anim";
import plain from "./animations/sec_plain.anim";
import disjoint from "./animations/sec_disjoint.anim";
import overlap from "./animations/sec_overlap.anim";

const APP = manifest.id;
const font = "normal"; // shorthand on purpose: busy-cli 0.6 on Windows breaks on literal `font:` (font-maps path)

function text(id: string, t: string) {
  return { id, type: "text", text: t, font, color: "#FFFFFFFF", x: 36, y: 8, align: "center" };
}
async function show(a: string): Promise<void> {
  await device.DisplayDraw({ application_name: APP, priority: 100, elements: [text("a", a)] as never });
}
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function play(id: string, path: string, section: string): Promise<void> {
  console.error("spike play " + id + " " + path + " " + section);
  try {
    await device.DisplayDraw({ application_name: APP, priority: 100, elements: [
      { id, type: "animation", path, x: 0, y: 0, width: 72, height: 16, loop: false, ...(section ? { section } : {}) } as never] });
    console.error("spike drew");
  } catch (e) { console.error("spike draw err " + String(e)); }
  await sleep(6000);
  try { await device.DisplayClear({ application_name: APP }); console.error("spike cleared"); } catch (e) { console.error("spike clear err " + String(e)); }
  await sleep(1500);
}

async function probe(): Promise<void> {
  await show("GO"); await sleep(1500);
  await play("m0", moon, "");
  await play("b", disjoint, "t2");
  await play("c", overlap, "t2");
  await play("d", overlap, "default");
}

function main(): void {
  let stopped = false;
  const unbind = listen("input", (ev) => {
    if (ev.key === "back" && ev.action === "short") {
      stopped = true;
      void device.DisplayClear({ application_name: APP }).catch(() => undefined);
      setTimeout(unbind, 0);
    }
  });
  void probe().catch((e) => console.error("spike fail " + String(e))).then(() => { if (!stopped) { stopped = true; void device.DisplayClear({ application_name: APP }).catch(() => undefined); setTimeout(unbind, 0); } });
}
main();
