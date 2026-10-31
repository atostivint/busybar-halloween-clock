import { APP, request, requestRetry, type ApiError } from "./api";
import type { El } from "./scene";

export { APP };

/** Sends the whole scene. Never diff-drawn: a single changed element makes the text vanish under heavy animations. */
export async function send(elements: El[], priority: number): Promise<void> {
  await requestRetry("POST", "/display/draw", { application_name: APP, priority, elements });
}

/** Removes everything this app drew. */
export async function clearScreen(): Promise<void> {
  try {
    await request("DELETE", "/display/draw?application_name=" + APP);
  } catch (err) {
    // 400 "not displaying anything" just means the screen was already empty.
    if ((err as ApiError).status !== 400) console.error(APP + ": clear failed: " + String(err));
  }
}
