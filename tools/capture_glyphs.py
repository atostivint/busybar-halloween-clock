"""Capture the clock glyphs (extra_large font) from the real bar into tools/glyphs.json.

    BAR=<ip> [BUSY_TOKEN=..] python tools/capture_glyphs.py

Quits the clock app, then draws each of "0123456789:" alone in white (top-left at 0,0) as application
"glyphcap" at priority 100, reads /api/screen and records the lit pixels: offset of the ink from the element
origin, size and mask. Also measures the natural ink gap between two digits and where the old single-element
layout (align center at 36,8) put the ink, so the per-character layout can reproduce it.
"""
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from screen import grab  # noqa: E402

BAR = os.environ.get("BAR", "10.0.4.20")
TOKEN = os.environ.get("BUSY_TOKEN", "")
APP = "glyphcap"
CHARS = "0123456789:"


def api(method, path, body=None):
    headers = {"X-API-Token": TOKEN} if TOKEN else {}
    data = None
    if body is not None:
        data, headers["Content-Type"] = json.dumps(body).encode(), "application/json"
    req = urllib.request.Request(f"http://{BAR}/api{path}", data=data, method=method, headers=headers)
    try:
        return urllib.request.urlopen(req, timeout=8).read()
    except urllib.error.HTTPError as e:
        if e.code != 400:  # 400 = "not displaying anything" on DELETE
            raise


def show(**element):
    api("POST", "/display/draw", {"application_name": APP, "priority": 100, "elements": [
        {"id": "g", "type": "text", "font": "extra_large", "color": "#FFFFFFFF", **element}]})
    time.sleep(0.7)
    return {(x, y) for y, row in enumerate(grab()) for x, p in enumerate(row) if max(p) > 128}


def bbox(pts):
    xs, ys = [p[0] for p in pts], [p[1] for p in pts]
    return min(xs), min(ys), max(xs), max(ys)


def main():
    try:
        api("POST", "/apps/quit")
    except urllib.error.HTTPError:
        pass
    time.sleep(1.5)
    api("DELETE", f"/display/draw?application_name={APP}")
    glyphs = {}
    for c in CHARS:
        pts = show(text=c, x=0, y=0)
        x0, y0, x1, y1 = bbox(pts)
        glyphs[c] = {"ox": x0, "oy": y0, "w": x1 - x0 + 1, "h": y1 - y0 + 1,
                     "mask": ["".join("#" if (x, y) in pts else "." for x in range(x0, x1 + 1)) for y in range(y0, y1 + 1)]}
        print(c, {k: v for k, v in glyphs[c].items() if k != "mask"})
    x0, _, x1, _ = bbox(show(text="00", x=0, y=0))
    gap = (x1 - x0 + 1) - 2 * glyphs["0"]["w"]
    _, top, _, _ = bbox(show(text="8", x=36, y=8, align="center"))
    ox0, _, ox1, _ = bbox(show(text="00:00", x=36, y=8, align="center"))
    api("DELETE", f"/display/draw?application_name={APP}")
    out = {"gap": gap, "ink_top": top, "old_ink_x": [ox0, ox1], "glyphs": glyphs}
    path = Path(__file__).resolve().parent / "glyphs.json"
    path.write_text(json.dumps(out, indent=1))
    print(f"gap {gap}, ink top row (old layout) {top}, old '00:00' ink x {ox0}..{ox1} -> {path}")


if __name__ == "__main__":
    main()
