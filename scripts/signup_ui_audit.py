zzzzz`````from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image


@dataclass
class BBox:
    x: int
    y: int
    w: int
    h: int


def _clusters(indices: np.ndarray) -> list[tuple[int, int]]:
    if indices.size == 0:
        return []

    out: list[tuple[int, int]] = []
    start = int(indices[0])
    prev = int(indices[0])

    for val in indices[1:]:
        cur = int(val)
        if cur == prev + 1:
            prev = cur
            continue
        out.append((start, prev))
        start = cur
        prev = cur

    out.append((start, prev))
    return out


def _largest_cluster(indices: np.ndarray) -> tuple[int, int] | None:
    clusters = _clusters(indices)
    if not clusters:
        return None
    return max(clusters, key=lambda c: c[1] - c[0])


def _load(path: str) -> np.ndarray:
    return np.array(Image.open(path).convert("RGB"), dtype=np.uint8)


def detect_header_nav(img: np.ndarray) -> tuple[tuple[int, int] | None, tuple[int, int] | None]:
    r, g, b = img[:, :, 0], img[:, :, 1], img[:, :, 2]
    purple = (
        (r >= 90)
        & (r <= 130)
        & (g >= 45)
        & (g <= 95)
        & (b >= 140)
        & (b <= 210)
    )

    row_ratio = purple.mean(axis=1)
    rows = np.where(row_ratio >= 0.64)[0]
    blocks = _clusters(rows)

    header = blocks[0] if len(blocks) > 0 else None
    nav = blocks[1] if len(blocks) > 1 else None
    return header, nav


def detect_card(img: np.ndarray) -> BBox | None:
    r, g, b = img[:, :, 0], img[:, :, 1], img[:, :, 2]
    gray = (
        (r >= 220)
        & (g >= 220)
        & (b >= 220)
        & (np.abs(r.astype(np.int16) - g.astype(np.int16)) <= 18)
        & (np.abs(g.astype(np.int16) - b.astype(np.int16)) <= 18)
    )

    mask = np.zeros_like(gray)
    mask[220:390, 120:780] = True
    roi = gray & mask

    row_counts = roi.sum(axis=1)
    row_block = _largest_cluster(np.where(row_counts >= 220)[0])
    if row_block is None:
        return None
    y0, y1 = row_block

    col_counts = roi[y0 : y1 + 1, :].sum(axis=0)
    cols = np.where(col_counts >= 6)[0]
    if cols.size == 0:
        return None
    x0, x1 = int(cols[0]), int(cols[-1])

    return BBox(x=x0, y=y0, w=x1 - x0 + 1, h=y1 - y0 + 1)


def detect_text_bbox(
    img: np.ndarray,
    *,
    y_start: int,
    y_end: int,
    x_start: int,
    x_end: int,
    threshold: int,
    row_pixels: int,
) -> BBox | None:
    r, g, b = img[:, :, 0], img[:, :, 1], img[:, :, 2]
    white = (r >= threshold) & (g >= threshold) & (b >= threshold)

    mask = np.zeros_like(white)
    mask[y_start:y_end, x_start:x_end] = True
    roi = white & mask

    row_counts = roi.sum(axis=1)
    row_block = _largest_cluster(np.where(row_counts >= row_pixels)[0])
    if row_block is None:
        return None
    y0, y1 = row_block

    col_counts = roi[y0 : y1 + 1, :].sum(axis=0)
    cols = np.where(col_counts >= 4)[0]
    if cols.size == 0:
        return None

    x0, x1 = int(cols[0]), int(cols[-1])
    return BBox(x=x0, y=y0, w=x1 - x0 + 1, h=y1 - y0 + 1)


def detect_icons_row(img: np.ndarray) -> BBox | None:
    r, g, b = img[:, :, 0], img[:, :, 1], img[:, :, 2]
    white = (r >= 220) & (g >= 220) & (b >= 220)

    mask = np.zeros_like(white)
    mask[340:470, 180:720] = True
    roi = white & mask

    row_counts = roi.sum(axis=1)
    row_block = _largest_cluster(np.where(row_counts >= 90)[0])
    if row_block is None:
        return None
    y0, y1 = row_block

    col_counts = roi[y0 : y1 + 1, :].sum(axis=0)
    cols = np.where(col_counts >= 5)[0]
    if cols.size == 0:
        return None
    x0, x1 = int(cols[0]), int(cols[-1])

    return BBox(x=x0, y=y0, w=x1 - x0 + 1, h=y1 - y0 + 1)


def sample_color(img: np.ndarray, x: int, y: int) -> tuple[int, int, int]:
    px = img[y, x]
    return int(px[0]), int(px[1]), int(px[2])


def color_delta_pct(c1: tuple[int, int, int], c2: tuple[int, int, int]) -> float:
    return (abs(c1[0] - c2[0]) + abs(c1[1] - c2[1]) + abs(c1[2] - c2[2])) / 765 * 100


def collect(path: str) -> dict:
    img = _load(path)
    header, nav = detect_header_nav(img)
    card = detect_card(img)
    title = detect_text_bbox(
        img,
        y_start=90,
        y_end=220,
        x_start=150,
        x_end=760,
        threshold=228,
        row_pixels=120,
    )
    subtitle = detect_text_bbox(
        img,
        y_start=200,
        y_end=300,
        x_start=150,
        x_end=760,
        threshold=210,
        row_pixels=120,
    )
    icons = detect_icons_row(img)

    return {
        "path": path,
        "size": {"w": int(img.shape[1]), "h": int(img.shape[0])},
        "header": {
            "y": header[0] if header else None,
            "h": (header[1] - header[0] + 1) if header else None,
        },
        "nav": {
            "y": nav[0] if nav else None,
            "h": (nav[1] - nav[0] + 1) if nav else None,
        },
        "card": vars(card) if card else None,
        "title": vars(title) if title else None,
        "subtitle": vars(subtitle) if subtitle else None,
        "icons": vars(icons) if icons else None,
        "colors": {
            "header_bg": sample_color(img, 30, 30),
            "overlay_bg": sample_color(img, 100, 100),
            "card_bg": sample_color(img, 450, 320),
            "nav_bg": sample_color(img, 450, 456),
        },
    }


def main() -> None:
    target_path = Path("screenshots/signup-step1-reference-match.png")
    actual_path = Path("screenshots/signup-mui-step1-v4.png")

    target = collect(str(target_path))
    actual = collect(str(actual_path))

    report = {
        "target": target,
        "actual": actual,
        "color_delta_pct": {
            k: color_delta_pct(target["colors"][k], actual["colors"][k])
            for k in target["colors"].keys()
        },
    }

    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()

