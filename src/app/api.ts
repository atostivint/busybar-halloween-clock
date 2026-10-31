import manifest from "../appmeta/manifest.json";

// Thin raw-fetch client for the few local endpoints this app may call. busy-lib's client was dropped
// because on firmware 1.3.1 it threw "TypeError: Expected a function" whenever the bar answered with an
// error status, which hid the status code.
const BASE = "http://" + __BUSY_ADDR__ + "/api";
export const APP = manifest.id;

export interface ApiError extends Error {
  kind: "network" | "http";
  status: number;
}

function fail(kind: ApiError["kind"], status: number, message: string): ApiError {
  // Property assignment, not Object.assign: the runtime throws "Expected a function" for the latter.
  const err = new Error(message) as ApiError;
  err.kind = kind;
  err.status = status;
  return err;
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** One request; returns the parsed JSON body (null when empty or not JSON). Throws an ApiError on failure. */
export async function request(method: string, path: string, body?: unknown): Promise<unknown> {
  const init: RequestInit = { method };
  if (body !== undefined) {
    // No `body` key at all otherwise: the device fetch would send the text "undefined".
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(body);
  }
  let response: Response;
  try {
    response = await fetch(BASE + path, init);
  } catch (err) {
    throw fail("network", 0, method + " " + path + ": " + String(err));
  }
  const status = Number(response.status); // may arrive as a string
  let text = "";
  try {
    text = await response.text();
  } catch (err) {
    console.error(APP + ": " + method + " " + path + " -> " + status + ", body unreadable: " + String(err));
  }
  if (status < 200 || status > 299) throw fail("http", status, method + " " + path + ": HTTP " + status + " " + text.slice(0, 120));
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

/** request() that retries the transient statuses (408/503/508: asset or display briefly busy). */
export async function requestRetry(method: string, path: string, body?: unknown): Promise<unknown> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await request(method, path, body);
    } catch (err) {
      const e = err as ApiError;
      const transient = e.kind === "http" && (e.status === 408 || e.status === 503 || e.status === 508);
      if (!transient || attempt >= 3) throw err;
      await sleep(400 * (attempt + 1));
    }
  }
}
