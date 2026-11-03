#!/usr/bin/env python3
"""
Makes an annotated clip of one moment in a recorded run, for showing a bug.

  clip.py <spec.json> [more specs...] --out <video.mp4>

Each spec is one chapter (several specs are joined in order):
  {
    "run": "<results dir>/<run name>",       recording (run.mov) and analysis (report.json)
    "title": "Bug 1: ...",                    title card, about 2 s
    "range": [first, last],                   rendered-frame indices (report.json timeline)
    "realtime": true,                         play the range once at real speed first
    "slow": 8,                                slow-motion factor; time-accurate: a frame that stood for
                                              2 display frames is held twice as long
    "phases": [{"from": i, "to": j, "caption": "...", "color": "ff5555"}],
    "highlight": [i, ...],                    frames outlined in red
    "zoom": {"x": pt, "y": pt, "w": pt, "h": pt},   optional magnified panel on the right
    "marker": {"axis": "x"|"y", "pos": pt, "from": i, "to": j},   optional yellow line
    "flip": [before, after], "flipCaption": "..."   alternate two frames, 6 times
  }

Captions are drawn by caption.swift (compiled on first use). Needs ffmpeg, numpy, swiftc.
"""
import json, os, subprocess, sys, tempfile
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
W, CH, PH = 1070, 140, 1312  # canvas width, caption bar height, panel height
MAIN_W = 603  # the recording at half resolution (1206 px wide)
ZOOM_X, ZOOM_W = 619, 450
TMP = tempfile.mkdtemp(prefix="clip-")


def caption_tool():
    exe = os.path.join(tempfile.gettempdir(), "harness-caption")
    if not os.path.exists(exe):
        subprocess.run(["swiftc", "-O", os.path.join(HERE, "caption.swift"), "-o", exe], check=True)
    return exe


_captions = {}


def caption(text, color="ffffff", height=CH):
    key = (text, color, height)
    if key not in _captions:
        png = os.path.join(TMP, f"c{len(_captions)}.png")
        subprocess.run([caption_tool(), png, str(W), str(height), text.replace("\n", "\\n"), color], check=True)
        raw = subprocess.run(["ffmpeg", "-v", "error", "-i", png, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], check=True, capture_output=True).stdout
        _captions[key] = np.frombuffer(raw, np.uint8).reshape(height, W, 3)
    return _captions[key]


def load_frames(run, video_frames):
    """Decodes the given video frames of run.mov at full resolution."""
    lo, hi = min(video_frames), max(video_frames)
    probe = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", os.path.join(run, "run.mov")], capture_output=True, text=True).stdout.strip().split(",")
    fw, fh = int(probe[0]), int(probe[1])
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(run, "run.mov"), "-fps_mode", "passthrough", "-vf", f"select=between(n\\,{lo}\\,{hi})", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], check=True, capture_output=True).stdout
    frames = np.frombuffer(raw, np.uint8).reshape(-1, fh, fw, 3)
    return {lo + k: frames[k] for k in range(len(frames))}, fw / 402


def chapter(spec):
    run = spec["run"]
    timeline = json.load(open(os.path.join(run, "report.json")))["timeline"]
    first, last = spec["range"]
    picks = list(range(first, last + 1))
    if spec.get("flip"):
        picks += spec["flip"]
    frames, px = load_frames(run, [timeline[i]["videoFrame"] for i in picks])
    frame_of = lambda i: frames[timeline[i]["videoFrame"]]
    zoom = spec.get("zoom")
    marker = spec.get("marker")
    highlight = set(spec.get("highlight", []))
    cache = {}

    def compose(i, cap, cap_color="ffffff", show_marker=False):
        key = (i, cap, cap_color, show_marker)
        if key in cache:
            return cache[key]
        f = frame_of(i)
        c = np.full((CH + PH, W, 3), 18, np.uint8)
        c[:CH] = caption(cap, cap_color)
        fh, fw, _ = f.shape
        main = f[: fh - fh % 2, : fw - fw % 2].reshape(fh // 2, 2, fw // 2, 2, 3).mean(axis=(1, 3)).astype(np.uint8)
        h = min(PH, main.shape[0]); c[CH : CH + h, :MAIN_W] = main[:h, :MAIN_W]
        if zoom:
            x0, y0, zw, zh = (int(zoom[k] * px) for k in ("x", "y", "w", "h"))
            scale = min(ZOOM_W / zw, PH / zh)
            yi = (np.arange(int(zh * scale)) / scale).astype(int) + y0
            xi = (np.arange(int(zw * scale)) / scale).astype(int) + x0
            panel = f[np.clip(yi, 0, fh - 1)][:, np.clip(xi, 0, fw - 1)]
            c[CH : CH + panel.shape[0], ZOOM_X : ZOOM_X + panel.shape[1]] = panel
        if show_marker and marker:
            if marker["axis"] == "x":
                x = int(marker["pos"] * px / 2); c[CH:, max(0, x - 1) : x + 2] = (255, 216, 77)
                if zoom:
                    zx = ZOOM_X + int((marker["pos"] - zoom["x"]) * px * scale)
                    if ZOOM_X <= zx < W: c[CH:, zx - 2 : zx + 3] = (255, 216, 77)
            else:
                y = CH + int(marker["pos"] * px / 2); c[y - 1 : y + 2, :MAIN_W] = (255, 216, 77)
                if zoom:
                    zy = CH + int((marker["pos"] - zoom["y"]) * px * scale)
                    if CH <= zy < CH + PH: c[zy - 2 : zy + 3, ZOOM_X:] = (255, 216, 77)
        if i in highlight:
            for sl in ((slice(CH, CH + 6), slice(0, W)), (slice(-6, None), slice(0, W)), (slice(CH, None), slice(0, 6)), (slice(CH, None), slice(W - 6, W))):
                c[sl] = (255, 60, 60)
        cache[key] = c.tobytes()
        return cache[key]

    out = []
    title = caption(spec["title"], "ffd84d", CH)
    card = np.full((CH + PH, W, 3), 18, np.uint8); card[PH // 2 : PH // 2 + CH] = title
    out += [card.tobytes()] * 120
    if spec.get("realtime", True):
        for i in range(first, last + 1):
            out += [compose(i, "Real speed")] * timeline[i].get("displayFrames", 1)
        out += [compose(last, "Real speed")] * 30
    slow = spec.get("slow", 8)
    phases = spec.get("phases", [])
    for i in range(first, last + 1):
        ph = next((p for p in phases if p["from"] <= i <= p["to"]), None)
        cap = (ph["caption"] if ph else "") + f"\n(slowed {slow}x)"
        hold = slow * timeline[i].get("displayFrames", 1) * (4 if i in highlight else 1)
        in_marker = bool(marker) and marker.get("from", first) <= i <= marker.get("to", last)
        out += [compose(i, cap, ph.get("color", "ffffff") if ph else "ffffff", in_marker)] * hold
    if spec.get("flip"):
        a, b = spec["flip"]
        fc = spec.get("flipCaption", "Before / after, flipping")
        for _ in range(6):
            out += [compose(a, fc, "ffd84d", True)] * 30 + [compose(b, fc, "ffd84d", True)] * 30
    return out


def main():
    args = sys.argv[1:]
    out_path = args[args.index("--out") + 1]
    specs = [a for a in args if a.endswith(".json")]
    enc = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{CH + PH}", "-r", "60", "-i", "-", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", out_path], stdin=subprocess.PIPE)
    total = 0
    for path in specs:
        for fr in chapter(json.load(open(path))):
            enc.stdin.write(fr); total += 1
    enc.stdin.close(); enc.wait()
    print(f"{out_path}: {total / 60:.1f} s")


if __name__ == "__main__":
    main()
