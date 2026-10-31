"""LED-style PNG of a screen grab (tools/screen.py grab()): round lit pixels on black, dependency-free.
usage: BAR=.. [BUSY_TOKEN=..] python tools/png.py out.png [count] [interval_s]   (count > 1 writes out_0.png, out_1.png, ...)"""
import struct
import sys
import time
import zlib

from screen import grab


def write_png(px, path, scale=8):
    w, h = 72 * scale, len(px) * scale
    rows = []
    for y in range(h):
        row = bytearray([0])
        for x in range(w):
            r, g, b = px[y // scale][x // scale]
            dx, dy = x % scale - scale / 2 + .5, y % scale - scale / 2 + .5
            k = 1.0 if dx * dx + dy * dy < (scale / 2 - .6) ** 2 else 0.12
            row += bytes((int(r * k), int(g * k), int(b * k)))
        rows.append(bytes(row))

    def chunk(tag, data):
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    sig = bytes([137, 80, 78, 71, 13, 10, 26, 10])
    with open(path, "wb") as f:
        f.write(sig + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0))
                + chunk(b"IDAT", zlib.compress(b"".join(rows))) + chunk(b"IEND", b""))


if __name__ == "__main__":
    out = sys.argv[1]
    n = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    dt = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
    for i in range(n):
        write_png(grab(), out if n == 1 else out.replace(".png", f"_{i}.png"))
        time.sleep(dt)
