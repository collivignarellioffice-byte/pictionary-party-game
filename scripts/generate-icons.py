"""Generate the app icon with Python's standard library only."""

from pathlib import Path
import struct
import zlib


ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"


def inside_rounded_rect(x, y, left, top, right, bottom, radius):
    if left + radius <= x <= right - radius or top + radius <= y <= bottom - radius:
        return left <= x <= right and top <= y <= bottom
    cx = left + radius if x < left + radius else right - radius
    cy = top + radius if y < top + radius else bottom - radius
    return (x - cx) ** 2 + (y - cy) ** 2 <= radius**2


def paint_circle(pixels, size, cx, cy, radius, color):
    left = max(0, int(cx - radius))
    right = min(size - 1, int(cx + radius))
    top = max(0, int(cy - radius))
    bottom = min(size - 1, int(cy + radius))
    rr = radius**2
    for y in range(top, bottom + 1):
        for x in range(left, right + 1):
            if (x - cx) ** 2 + (y - cy) ** 2 <= rr:
                pixels[y][x] = color


def paint_line(pixels, size, start, end, width, color):
    x1, y1 = start
    x2, y2 = end
    steps = max(abs(x2 - x1), abs(y2 - y1))
    for step in range(steps + 1):
        ratio = step / max(steps, 1)
        x = x1 + (x2 - x1) * ratio
        y = y1 + (y2 - y1) * ratio
        paint_circle(pixels, size, x, y, width / 2, color)


def png_chunk(kind, data):
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)


def write_png(path, pixels, size):
    raw = b"".join(b"\x00" + bytes(channel for pixel in row for channel in pixel) for row in pixels)
    header = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    path.write_bytes(b"\x89PNG\r\n\x1a\n" + png_chunk(b"IHDR", header) + png_chunk(b"IDAT", zlib.compress(raw, 9)) + png_chunk(b"IEND", b""))


def generate(size, destination):
    navy = (16, 53, 77, 255)
    cream = (255, 247, 223, 255)
    colors = [(189, 41, 45, 255), (121, 163, 191, 255), (173, 203, 103, 255), (247, 177, 61, 255)]
    pixels = [[navy for _ in range(size)] for _ in range(size)]

    margin = round(size * 0.175)
    gap = round(size * 0.055)
    tile = round((size - 2 * margin - gap) / 2)
    radius = round(size * 0.07)
    boxes = [
        (margin, margin),
        (margin + tile + gap, margin),
        (margin, margin + tile + gap),
        (margin + tile + gap, margin + tile + gap),
    ]
    for (left, top), color in zip(boxes, colors):
        right, bottom = left + tile, top + tile
        for y in range(top, bottom + 1):
            for x in range(left, right + 1):
                if inside_rounded_rect(x, y, left, top, right, bottom, radius):
                    pixels[y][x] = color

    paint_line(
        pixels,
        size,
        (round(size * 0.42), round(size * 0.78)),
        (round(size * 0.74), round(size * 0.46)),
        max(2, round(size * 0.045)),
        cream,
    )
    write_png(destination, pixels, size)


if __name__ == "__main__":
    generate(1024, ASSETS / "icon.png")
    generate(1024, ASSETS / "adaptive-icon.png")
    generate(1024, ASSETS / "splash-icon.png")
    generate(48, ASSETS / "favicon.png")
