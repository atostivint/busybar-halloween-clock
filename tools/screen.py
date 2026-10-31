"""Dump the bar's front screen as ASCII, once or repeatedly. usage: BAR=.. [BUSY_TOKEN=..] python tools/screen.py [count] [interval_s]"""
import base64, os, sys, time, urllib.request

def grab(bar=None, token=None):
    bar, token = bar or os.environ.get("BAR", "10.0.4.20"), token or os.environ.get("BUSY_TOKEN", "")
    req = urllib.request.Request(f"http://{bar}/api/screen?display=0", headers={"X-API-Token": token} if token else {})
    data = base64.b64decode(urllib.request.urlopen(req, timeout=5).read())
    return [[tuple(data[(y * 72 + x) * 3:(y * 72 + x) * 3 + 3][::-1]) for x in range(72)] for y in range(16)]  # RGB

def ascii_art(px):
    return "\n".join("".join("#" if max(p) > 60 else "." for p in row) for row in px)

if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    dt = float(sys.argv[2]) if len(sys.argv) > 2 else 1.0
    for i in range(n):
        print(f"--- t={i * dt:.1f}s"); print(ascii_art(grab())); time.sleep(dt)
