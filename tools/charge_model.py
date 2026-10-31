"""The lightning charge: colour curve and glow shape, ported from the Python halloween-clock app.
src/app/charge.ts mirrors chargeColor() so the clock text can be redrawn in the colour the fade has reached."""
import colorsys
import math

CHARGE_SECONDS, CHARGE_FPS = 24.0, 10     # a strike turns the clock green; it fades back to its colour
FLASH, GAP = (170, 255, 190), (0, 110, 12)
GLOW_C, GLOW_HALF, GLOW_ORANGE = (36.0, 7.9), (15.0, 4.4), (255, 100, 0)   # the haze behind the time (see gen_graveyard.py)
GLOW_FPS = 2

# The clock colours the user can pick. The fade ends on the chosen colour, so each one has its own set of files.
PRESETS = {
    "orange": (255, 122, 0),
    "red": (255, 40, 20),
    "purple": (170, 60, 255),
    "white": (255, 255, 255),
}


def fade_u(t):
    """0 while flashing and holding green, then a smoothstep 0..1 sweeping back to the clock colour."""
    k = t / CHARGE_SECONDS
    if k < 0.2:
        return 0.0
    u = min(1.0, (k - 0.2) / 0.8)
    return u * u * (3 - 2 * u)


def charge_color(t, orange):
    """Colour t seconds after the strike: flickers with the two bolts (flash, gap, flash), holds an electric
    green, then the hue sweeps green -> yellow -> the clock colour (full saturation, so it never goes pale or muddy)."""
    if t < 0.1 or 0.2 <= t < 0.4:
        return FLASH
    if t < 0.2:
        return GAP
    green = 125 / 360
    h0, s0, v0 = colorsys.rgb_to_hsv(*(c / 255 for c in orange))
    u = fade_u(t)
    h, sat, val = green + (h0 - green) * u, 1.0 + (s0 - 1.0) * u, 1.0 + (v0 - 1.0) * u
    return tuple(round(c * 255) for c in colorsys.hsv_to_rgb(h, sat, val))


def glow_level(x, y, f):
    """Strength (0..~0.24) of the glow behind the time at pixel (x, y), animation frame f (20 fps)."""
    breathe = 0.5 + 0.5 * math.sin(2 * math.pi * f / 60 - 1.0)
    dx, dy = max(abs(x - GLOW_C[0]) - GLOW_HALF[0], 0), max(abs(y - GLOW_C[1]) - GLOW_HALF[1], 0)
    return (0.10 + 0.14 * breathe) * math.exp(-((math.hypot(dx, dy) / 3.4) ** 2))
