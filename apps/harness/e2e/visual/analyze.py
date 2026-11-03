#!/usr/bin/env python3
"""
Flags blanks, flickers and jumps in a screen recording of the harness app.

  analyze.py <video> --out <dir> [--points 402x874] [--allow-blank 0.0005]

Reads every recorded frame at point resolution, puts them in render order by
the app's frame stamp (labs/stamp.tsx), drops repeated captures, and checks
consecutive rendered frames:

  blank    more than --allow-blank of the screen is the BLANK color (#ff00ff),
           which only shows where no screen covers the window
  flicker  a frame that differs from both neighbours while the neighbours
           match each other: something appeared or vanished for one frame
  jump     (with --track) a tracked screen edge moves by a step that departs
           sharply from the steps around it: a screen leaps instead of moving
           smoothly, or snaps somewhere and carries on from there
  reversal (with --track) what looks like a flicker is a tracked screen changing
           direction (e.g. a pop landing mid-push); reported, not a failure
  burst    the fraction of pixels that changed in one display frame is much
           higher than around it (coarser than jump; catches what no tracked
           edge shows)

--track x@0.7 follows the edges crossing the row at 70% of the height (horizontal
motion); y@0.5 the edges crossing the column at half the width (vertical motion).
Pick a line that crosses only screen backgrounds. Edges that never move (text,
buttons) are ignored; the tracked edge is the moving one nearest its last position.

Writes <out>/report.json (summary, events, per-frame timeline) and, for every
event, <out>/event-<n>-<kind>.png: the rendered frames around it at half point
resolution, the flagged frame outlined in red (blank pixels painted as they
are, magenta). Needs ffmpeg and numpy.
"""
import argparse
import json
import os
import struct
import subprocess
import sys
import zlib

import numpy as np

# Must match labs/stamp.tsx.
STAMP_LEFT, STAMP_BOTTOM, STAMP_CELL, STAMP_BITS = 24, 6, 12, 10
STAMP_UNIT_MS = 1000 / 120
MOD = 1 << STAMP_BITS

STATUS_BAR = 50  # points from the top ignored (the clock)
CHANGED = 32  # per-channel difference that counts as a changed pixel


def write_png(path, rgb):
    h, w, _ = rgb.shape
    raw = b"".join(b"\x00" + rgb[y].tobytes() for y in range(h))
    chunk = lambda tag, data: struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
    with open(path, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n")
        f.write(chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)))
        f.write(chunk(b"IDAT", zlib.compress(raw, 6)))
        f.write(chunk(b"IEND", b""))


def frames(video, w, h):
    cmd = ["ffmpeg", "-v", "error", "-i", video, "-fps_mode", "passthrough", "-vf", f"scale={w}:{h}:flags=area", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    size = w * h * 3
    while True:
        buf = proc.stdout.read(size)
        if len(buf) < size:
            break
        yield np.frombuffer(buf, np.uint8).reshape(h, w, 3)
    proc.wait()


def read_stamp(frame, h):
    rows = []
    for row in range(2):
        cy = h - STAMP_BOTTOM - 2 * STAMP_CELL + row * STAMP_CELL + STAMP_CELL // 2
        value = 0
        for bit in range(STAMP_BITS):
            cx = STAMP_LEFT + bit * STAMP_CELL + STAMP_CELL // 2
            if frame[cy - 2 : cy + 2, cx - 2 : cx + 2].mean() > 128:
                value |= 1 << bit
        rows.append(value)
    return rows


def edges_of(line):
    """Centres of colour edges along a line of pixels."""
    d = np.abs(line[2:] - line[:-2]).sum(axis=1)
    idx = np.where(d > 90)[0]
    out, start = [], None
    for k, i in enumerate(idx):
        if start is None:
            start = i
        if k == len(idx) - 1 or idx[k + 1] > i + 2:
            out.append((start + i) / 2 + 1)
            start = None
    return out


def follow_edge(tr, timeline, flags, jump_pt):
    """Tracks the moving edge along tr's line and flags steps that depart from the steps around them."""
    length = len(tr["lines"][0])
    all_edges = [edges_of(line) for line in tr["lines"]]
    # Edges at the same place in most frames belong to content that doesn't move.
    counts = {}
    for es in all_edges:
        for e in {round(e) for e in es}:
            counts[e] = counts.get(e, 0) + 1
    static = {e for e, c in counts.items() if c > 0.6 * len(all_edges)}
    pos = []
    for es in all_edges:
        es = [e for e in es if round(e) not in static and round(e) - 1 not in static and round(e) + 1 not in static]
        last = next((p for p in reversed(pos) if p is not None), None)
        if es:
            pos.append(min(es, key=lambda e: abs(e - last)) if last is not None else es[0])
        elif last is not None:
            # No moving edge: the screen is at rest against the nearer boundary (or gone).
            pos.append(0.0 if last < length / 2 else float(length))
        else:
            pos.append(None)
    vel = [None] * len(pos)
    for n in range(1, len(pos)):
        if pos[n] is not None and pos[n - 1] is not None:
            vel[n] = (pos[n] - pos[n - 1]) / timeline[n].get("displayFrames", 1)
    for n, e in enumerate(timeline):
        e[tr["name"]] = pos[n]
    for n, v in enumerate(vel):
        if v is None:
            continue
        around = [vel[k] for k in range(max(1, n - 3), min(len(vel), n + 4)) if k != n and vel[k] is not None]
        if not around:
            continue
        expected = float(np.median(around))
        speed = float(np.median([abs(a) for a in around]))
        if abs(v - expected) > max(jump_pt, 2.0 * speed):
            flags.append((n, "jump", abs(v - expected)))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("video")
    ap.add_argument("--out", required=True)
    ap.add_argument("--points", default="402x874", help="window size in points (the recording is scaled to it)")
    ap.add_argument("--allow-blank", type=float, default=0.0005, help="fraction of the screen that may be blank")
    ap.add_argument("--jump-ratio", type=float, default=3.0)
    ap.add_argument("--jump-min", type=float, default=0.02, help="changed fraction per display frame below which nothing is a jump")
    ap.add_argument("--flicker-min", type=float, default=0.01)
    ap.add_argument("--track", action="append", default=[], help="x@<row fraction> or y@<column fraction>")
    ap.add_argument("--jump-pt", type=float, default=8, help="smallest step change (points per display frame) that is a jump")
    args = ap.parse_args()
    w, h = map(int, args.points.split("x"))
    os.makedirs(args.out, exist_ok=True)

    mask = np.ones((h, w), bool)
    mask[:STATUS_BAR] = False
    mask[h - STAMP_BOTTOM - 2 * STAMP_CELL - 4 :, : STAMP_LEFT + STAMP_BITS * STAMP_CELL + 4] = False
    area = mask.sum()

    def changed(a, b):
        return float((np.abs(a.astype(np.int16) - b.astype(np.int16)).max(axis=2) > CHANGED)[mask].sum() / area)

    def blank(a):
        r, g, b = a[..., 0], a[..., 1], a[..., 2]
        return float(((r > 200) & (g < 90) & (b > 200))[mask].sum() / area)

    tracks = []
    for spec in args.track:
        axis, at = spec.split("@")
        tracks.append({"name": spec, "axis": axis, "at": float(at), "lines": []})

    timeline, thumbs = [], []
    prev = prev2 = None
    last_stamp = None
    count_base = time_base = None
    for vi, frame in enumerate(frames(args.video, w, h)):
        count, time = read_stamp(frame, h)
        if (count, time) == last_stamp:
            continue  # the recorder captured the same rendered frame again
        if last_stamp is None:
            count_abs, time_abs = 0, 0
        else:
            count_abs = timeline[-1]["count"] + (count - last_stamp[0]) % MOD
            time_abs = timeline[-1]["timeUnits"] + (time - last_stamp[1]) % MOD
        last_stamp = (count, time)
        entry = {"i": len(timeline), "videoFrame": vi, "count": count_abs, "timeUnits": time_abs, "blank": blank(frame)}
        if prev is not None:
            entry["changed"] = changed(prev, frame)
        if prev2 is not None:
            entry["changedSkip"] = changed(prev2, frame)
        timeline.append(entry)
        thumbs.append(frame[::2, ::2].copy())
        for tr in tracks:
            line = frame[int(h * tr["at"])] if tr["axis"] == "x" else frame[:, int(w * tr["at"])]
            tr["lines"].append(line.astype(np.int16))
        prev2, prev = prev, frame

    if len(timeline) < 3:
        print(json.dumps({"error": "fewer than 3 rendered frames", "frames": len(timeline)}))
        sys.exit(2)

    # Display frame length in stamp units: the most common time step between consecutive rendered frames.
    steps = [b["timeUnits"] - a["timeUnits"] for a, b in zip(timeline, timeline[1:]) if b["timeUnits"] > a["timeUnits"]]
    vsync = max(1, int(np.median(steps))) if steps else 2
    for a, b in zip(timeline, timeline[1:]):
        # More than one display frame since the last recorded frame: the app dropped frames or the
        # recorder missed some (frame callbacks also run on touch events, so the count can't tell which).
        b["displayFrames"] = max(1, round((b["timeUnits"] - a["timeUnits"]) / vsync))
        b["motion"] = b["changed"] / b["displayFrames"]
    for e in timeline:
        e["ms"] = round(e["timeUnits"] * STAMP_UNIT_MS, 1)

    flags = []
    for tr in tracks:
        follow_edge(tr, timeline, flags, args.jump_pt)
    for n, e in enumerate(timeline):
        if e["blank"] > args.allow_blank:
            flags.append((n, "blank", e["blank"]))
        if 0 < n < len(timeline) - 1:
            a, b = e.get("changed", 0), timeline[n + 1].get("changed", 0)
            skip = timeline[n + 1].get("changedSkip", 1)
            if min(a, b) > args.flicker_min and skip < 0.3 * min(a, b):
                # A tracked edge that steps one way then back is a screen changing direction, not a flicker.
                turned = any(
                    None not in (e.get(t), timeline[n - 1].get(t), timeline[n + 1].get(t))
                    and (e[t] - timeline[n - 1][t]) * (timeline[n + 1][t] - e[t]) < 0
                    for t in args.track
                )
                flags.append((n, "reversal" if turned else "flicker", min(a, b)))
        if "motion" in e:
            around = [timeline[k]["motion"] for k in range(max(1, n - 3), min(len(timeline), n + 4)) if k != n and "motion" in timeline[k]]
            base = float(np.median(around)) if around else 0
            if e["motion"] > args.jump_min and e["motion"] > args.jump_ratio * base + args.jump_min / 2:
                flags.append((n, "burst", e["motion"]))

    # Consecutive flags of one kind form one event.
    events = []
    for n, kind, value in sorted(flags, key=lambda f: (f[1], f[0])):
        last = events[-1] if events else None
        if last and last["kind"] == kind and n - last["last"] <= 2:
            last["last"] = n
            last["peak"] = max(last["peak"], value)
        else:
            events.append({"kind": kind, "first": n, "last": n, "peak": value})
    events.sort(key=lambda e: e["first"])

    th, tw, _ = thumbs[0].shape
    for k, ev in enumerate(events):
        lo, hi = max(0, ev["first"] - 3), min(len(thumbs), ev["last"] + 4)
        pad = 4
        sheet = np.full((th + 2 * pad, (hi - lo) * (tw + pad) + pad, 3), 30, np.uint8)
        for j, n in enumerate(range(lo, hi)):
            x = pad + j * (tw + pad)
            if ev["first"] <= n <= ev["last"]:
                sheet[: th + 2 * pad, x - pad : x + tw + pad] = (255, 40, 40)
            sheet[pad : pad + th, x : x + tw] = thumbs[n]
        ev["image"] = f"event-{k + 1}-{ev['kind']}.png"
        ev["ms"] = timeline[ev["first"]]["ms"]
        ev["frames"] = [lo, hi - 1]
        write_png(os.path.join(args.out, ev["image"]), sheet)

    summary = {
        "renderedFrames": len(timeline),
        "videoFrames": timeline[-1]["videoFrame"] + 1,
        "displayFrameMs": round(vsync * STAMP_UNIT_MS, 2),
        "gaps": sum(1 for e in timeline if e.get("displayFrames", 1) > 1),
        "framesInGaps": sum(e.get("displayFrames", 1) - 1 for e in timeline),
        "events": {kind: sum(1 for e in events if e["kind"] == kind) for kind in ("blank", "flicker", "jump", "burst", "reversal")},
    }
    with open(os.path.join(args.out, "report.json"), "w") as f:
        json.dump({"summary": summary, "events": events, "timeline": timeline}, f, indent=1)
    print(json.dumps(summary))
    for ev in events:
        print(f"  {ev['kind']:8s} {ev['ms']:9.1f} ms  frames {ev['first']}-{ev['last']}  peak {ev['peak']:.3f}  {ev['image']}")
    # Reversals are reported for review but aren't failures on their own.
    sys.exit(1 if any(e["kind"] != "reversal" for e in events) else 0)


if __name__ == "__main__":
    main()
