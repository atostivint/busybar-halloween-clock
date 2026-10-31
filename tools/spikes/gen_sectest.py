"""Spike: 40-frame 72x16 bar that grows left to right, with OVERLAPPING sections t0..t3
(start 0/10/20/30, all ending at frame 39). Playing section t2 should start at ~half and run to the end."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from make_anim import write_anim

W, H, N = 72, 16, 40
frames = []
for i in range(N):
    cols = round((i + 1) * W / N)
    px = bytearray()
    for y in range(H):
        for x in range(W):
            px += bytes((0, 255, 0, 255)) if (x < cols and 6 <= y <= 9) else bytes(4)   # BGRA green
    frames.append(bytes(px))
base = Path(__file__).resolve().parent.parent.parent / "src" / "animations"
variants = {
    "sec_plain": None,
    "sec_disjoint": [(f"t{k}", k * 10, k * 10 + 9) for k in range(4)],
    "sec_overlap": [(f"t{k}", k * 10, N - 1) for k in range(4)],
}
for name, secs in variants.items():
    write_anim(base / f"{name}.anim", frames, W, H, 10, secs)
    print("wrote", name, (base / f"{name}.anim").stat().st_size)
