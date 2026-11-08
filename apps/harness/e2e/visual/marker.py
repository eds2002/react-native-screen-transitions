#!/usr/bin/env python3
"""
Tracks the marked shared element (boundary labs with ?marker=1: card 3's element is #00ff66 on every
screen) through a screen recording and flags what a shared element must never do:

  missing  the element is not drawn in a frame between frames where it is
  double   two separate copies are drawn (a source and a destination that disagree)
  jump     its center moves by a step (per 60 Hz frame: a recording leaves out frames that were not
           drawn) that stands out from the steps on both sides (it snaps and carries on from there)
  resize   its size changes by a ratio that stands out from the changes on both sides

  marker.py <video> [--points 402] [--json out.json]

Frames are read as recorded (a simulator recording holds only changed frames, in order) at a third of
point resolution. Prints a summary and every event; writes the per-frame track with --json. Exit code
1 when anything is flagged. Needs ffmpeg and numpy.
"""
import argparse
import json
import subprocess
import sys

import numpy as np

SCALE = 3  # points per sampled pixel
MIN_BLOB = 8  # sampled pixels (72 pt²): smaller blobs are specks (anti-aliasing, green UI bits)
G = 5  # sampled pixels (15 pt): blobs closer than this are one element cut by an overlay
JUMP_PT = 18  # a center step this large (points per 60 Hz frame) is a jump candidate
JUMP_RATIO = 3.0  # ... when it is this many times the steps around it
RESIZE_RATIO = 1.45


def timestamps(video):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "frame=pts_time", "-of", "csv=p=0", video],
        capture_output=True, text=True, check=True,
    ).stdout.split()
    return [float(x.strip(",")) for x in out]


def frames(video, width):
    probe = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", video],
        capture_output=True, text=True, check=True,
    ).stdout.strip().split(",")
    w, h = width // SCALE, round(int(probe[1]) * (width / int(probe[0])) / SCALE)
    proc = subprocess.Popen(
        ["ffmpeg", "-v", "error", "-i", video, "-vf", f"scale={w}:{h}:flags=area", "-fps_mode", "passthrough", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
        stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
    )
    size = w * h * 3
    while True:
        buf = proc.stdout.read(size)
        if len(buf) < size:
            break
        yield np.frombuffer(buf, np.uint8).reshape(h, w, 3)


def blobs(mask):
    """Connected components (4-neighbour) of a boolean mask: [(area, x0, y0, x1, y1, cx, cy)]."""
    h, w = mask.shape
    seen = np.zeros_like(mask)
    out = []
    ys, xs = np.nonzero(mask)
    for sy, sx in zip(ys, xs):
        if seen[sy, sx]:
            continue
        stack = [(sy, sx)]
        seen[sy, sx] = True
        pts = []
        while stack:
            y, x = stack.pop()
            pts.append((y, x))
            for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    stack.append((ny, nx))
        if len(pts) < MIN_BLOB:
            continue
        py = [p[0] for p in pts]
        px = [p[1] for p in pts]
        out.append([len(pts), int(min(px)), int(min(py)), int(max(px)), int(max(py)), float(sum(px)), float(sum(py))])
    # One element split by what is drawn over it (the live card's bar) is still one: merge blobs
    # whose boxes touch.
    merged = True
    while merged:
        merged = False
        for i in range(len(out)):
            for j in range(i + 1, len(out)):
                a, b = out[i], out[j]
                if a[1] - G <= b[3] and b[1] - G <= a[3] and a[2] - G <= b[4] and b[2] - G <= a[4]:
                    out[i] = [a[0] + b[0], min(a[1], b[1]), min(a[2], b[2]), max(a[3], b[3]), max(a[4], b[4]), a[5] + b[5], a[6] + b[6]]
                    del out[j]
                    merged = True
                    break
            if merged:
                break
    return sorted(((n, x0, y0, x1, y1, sx / n, sy / n) for n, x0, y0, x1, y1, sx, sy in out), reverse=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--points", type=int, default=402)
    ap.add_argument("--json")
    args = ap.parse_args()

    pts = timestamps(args.video)
    track = []
    for i, rgb in enumerate(frames(args.video, args.points)):
        r, g, b = (rgb[..., k].astype(int) for k in range(3))
        # #00ff66, with some room for the live content's translucent bar drawn over it.
        mask = (g > 190) & (r < 90) & (b > 50) & (b < 170)
        found = blobs(mask)
        main_blob = found[0] if found else None
        track.append({
            "frame": i,
            "ms": round(pts[i] * 1000, 1) if i < len(pts) else None,
            "blobs": len(found),
            "second": found[1][0] * SCALE * SCALE if len(found) > 1 else 0,
            "area": main_blob[0] * SCALE * SCALE if main_blob else 0,
            "box": [v * SCALE for v in main_blob[1:5]] if main_blob else None,
            "center": [round(main_blob[5] * SCALE, 1), round(main_blob[6] * SCALE, 1)] if main_blob else None,
        })

    events = []
    present = [t["center"] is not None for t in track]
    first = present.index(True) if any(present) else None
    last = len(present) - 1 - present[::-1].index(True) if any(present) else None
    if first is not None:
        i = first
        while i <= last:
            if not present[i]:
                j = i
                while not present[j]:
                    j += 1
                events.append({"kind": "missing", "frame": i, "frames": j - i})
                i = j
            i += 1
    for t in track:
        # A second blob a sizeable fraction of the first: two copies, not a sliver of anti-aliasing.
        if t["blobs"] > 1 and t["second"] > 0.15 * t["area"]:
            events.append({"kind": "double", "frame": t["frame"], "areas": [t["area"], t["second"]]})

    steps = [None] * len(track)
    for i in range(1, len(track)):
        a, b = track[i - 1]["center"], track[i]["center"]
        if a and b:
            frames_between = max(1.0, (track[i]["ms"] - track[i - 1]["ms"]) / 16.7) if track[i]["ms"] is not None else 1.0
            steps[i] = ((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2) ** 0.5 / frames_between
    for i, d in enumerate(steps):
        if d is None or d < JUMP_PT:
            continue
        around = [steps[k] for k in (i - 2, i - 1, i + 1, i + 2) if 0 <= k < len(steps) and steps[k] is not None]
        if not around or d > JUMP_RATIO * max(max(around), 6):
            events.append({"kind": "jump", "frame": i, "step": round(d, 1), "around": [round(x, 1) for x in around]})

    for i in range(1, len(track) - 1):
        a, b, c = track[i - 1]["area"], track[i]["area"], track[i + 1]["area"]
        if not (a and b and c):
            continue
        ratio = max(b / a, a / b)
        back = max(c / b, b / c)
        # A one-frame size spike (out and back), or a step change much larger than the next one.
        if ratio > RESIZE_RATIO and (back > RESIZE_RATIO or ratio > 2.2):
            events.append({"kind": "resize", "frame": i, "from": a, "to": b, "next": c})

    end = track[-1] if track else None
    summary = {
        "frames": len(track),
        "present": sum(present),
        "end": {"box": end["box"], "blobs": end["blobs"]} if end else None,
        "events": {k: sum(1 for e in events if e["kind"] == k) for k in ("missing", "double", "jump", "resize")},
    }
    print(json.dumps(summary))
    for e in events:
        print(json.dumps(e))
    if args.json:
        with open(args.json, "w") as f:
            json.dump({"summary": summary, "events": events, "track": track}, f)
    sys.exit(1 if events else 0)


if __name__ == "__main__":
    main()
