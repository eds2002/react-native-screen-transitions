#!/usr/bin/env python3
"""
Tap and gesture spam over the boundary labs, each run checked frame by frame (spam.sh + marker.py).

  spam-matrix.py [--configs substr,...] [--scripts substr,...] [--out results.jsonl]
  spam-matrix.py --emit [--configs ...] [--scripts ...] [--platform ios|android]

Configs are lab × recipe × motion × tree; scripts are finger scripts written per config (the swipe
that dismisses a screen depends on its motion and level). One JSON line per run goes to --out
(default e2e/results/spam/matrix.jsonl) and a table of the flagged runs is printed at the end.

--emit writes the same runs as Argent e2e tests instead (apps/harness/.argent/e2e/spam, checks in
e2e/argent/spam), with the same verdict: run them with e2e/argent/run.sh <device> --spam [filter], or
`argent e2e run .argent/e2e/spam` with the device in .argent/device.
"""
import argparse, json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
NEXT, BACK, SCROLL, UNDER = 0.1, 0.3, 0.5, 0.7
BAR_Y = 0.135
# card 3 on the unscrolled list (describe: sb-card-3, se-card-3). Android (Pixel 4a, 3-button nav)
# lays the list out lower, with the nav bar over the last ~5%: its points are set by --platform.
CARD3 = {"shared-bounds": (0.809, 0.887), "shared-elements": (0.809, 0.829)}
CARD3_ANDROID = {"shared-bounds": (0.809, 0.925), "shared-elements": (0.809, 0.89)}
# Whether runs track the marked element frame by frame (--no-track: end state only).
TRACKING = [True]


def configs():
    out = []
    for lab, recipes in (("shared-bounds", ("styles", "auto", "zoom", "zoom-bound")), ("shared-elements", ("styles", "auto"))):
        for recipe in recipes:
            # auto: no line for the boundary; it flies on its own (transform; shuffle uses size, so not here).
            motions = (
                ("slide", "diagonal", "swirl", "still", "shuffle") if recipe == "styles"
                else ("slide", "still") if recipe == "auto"
                else ("still",)
            )
            for motion in motions:
                trees = (("flat", 1), ("below", 2), ("above", 2)) if recipe != "zoom-bound" else (("flat", 1),)
                if recipe == "styles" and motion in ("still", "shuffle"):
                    trees = (("flat", 1), ("below", 2))
                for tree, depth in trees:
                    q = f"recipe={recipe}&motion={motion}&tree={tree}&depth={depth}"
                    # Shuffle the way the demo uses it: the size method.
                    if motion == "shuffle":
                        q += "&method=size"
                    name = f"{'sb' if lab == 'shared-bounds' else 'se'}-{recipe}-{motion}-{tree}{depth}"
                    # sb zoom: the screen grows out of the card, there is no element to follow.
                    track = TRACKING[0] and not (lab == "shared-bounds" and recipe == "zoom")
                    out.append({"lab": lab, "query": q, "name": name, "recipe": recipe, "motion": motion, "track": track})
                    # look=styled: the two ends look different (corners, border, shadow, opacity), so
                    # each flight carries its look along; it must stay seamless under spam too.
                    if lab == "shared-bounds" and recipe == "styles" and motion in ("slide", "swirl") and tree in ("flat", "below"):
                        out.append({"lab": lab, "query": q + "&look=styled", "name": f"{name}-styled",
                                    "recipe": recipe, "motion": motion, "track": track})
                        if motion == "slide":
                            out.append({"lab": lab, "query": q + "&method=size&look=styled",
                                        "name": f"sb-styles-slide-size-{tree}{depth}-styled",
                                        "recipe": recipe, "motion": motion, "track": track})
                    # Swiped shared elements with the size method: a size element is resized, never
                    # scaled, even when overlapping closes re-aim it (the scaled content showed).
                    if lab == "shared-elements" and recipe == "styles" and motion == "slide":
                        out.append({"lab": lab, "query": q + "&method=size", "name": f"se-styles-slide-size-{tree}{depth}",
                                    "recipe": recipe, "motion": motion, "track": track})
    return out


def is_zoom(cfg):
    """Zoom recipes dismiss vertically and pinch; styles and auto move like any screen."""
    return cfg["recipe"] in ("zoom", "zoom-bound")


class Script:
    """Builds a finger script, tracking the level the focused Detail is at to pick the swipe."""

    def __init__(self, cfg):
        self.cfg, self.level, self.parts = cfg, 0, []

    def tap(self, x):
        self.parts.append(f"down {x},{BAR_Y}; up")
        return self

    def next(self):
        """On the list, open card 3 itself (the bar's next follows the focused screen, which lags
        behind a screen flung away mid-push); deeper, the bar's next."""
        if self.level == 0:
            x, y = CARD3[self.cfg["lab"]]
            self.parts.append(f"down {x},{y}; up")
            self.level = 1
            return self
        self.level += 1
        return self.tap(NEXT)

    def back(self):
        self.level = max(0, self.level - 1)
        return self.tap(BACK)

    def wait(self, ms):
        self.parts.append(f"wait {ms}")
        return self

    def direction(self):
        if is_zoom(self.cfg) or self.cfg["motion"] == "swirl":
            return "v"
        if self.cfg["motion"] == "diagonal" and self.level % 4 >= 2:
            return "hinv"
        return "h"

    def path(self, frac):
        d = self.direction()
        if d == "h":
            return (0.1, 0.78), (0.1 + 0.8 * frac, 0.78)
        if d == "hinv":
            return (0.9, 0.78), (0.9 - 0.8 * frac, 0.78)
        return (0.5, 0.3), (0.5, 0.3 + 0.6 * frac)

    def swipe(self, ms=200, frac=1.0, mid=False):
        """Drag the focused screen away (frac of the way) and let go. mid: it is still arriving, so
        grab it where it already is (the middle) and fling it off."""
        (x0, y0), (x1, y1) = self.path(frac)
        if mid:
            d = self.direction()
            x0, y0 = 0.5, 0.6
            x1, y1 = {"h": (0.99, 0.6), "hinv": (0.01, 0.6), "v": (0.5, 0.99)}[d]
        self.parts.append(f"down {x0},{y0}; move {x1:.3f},{y1:.3f} {ms}; up")
        if frac >= 0.5 or ms <= 250:
            self.level = max(0, self.level - 1)
        return self

    def regrab(self, ms=180):
        """Grab the screen while it closes and drag it back the way it came (it should reopen)."""
        (x0, y0), (x1, y1) = self.path(1.0)
        mx, my = (x0 + x1) / 2, (y0 + y1) / 2
        self.parts.append(f"down {mx:.3f},{my:.3f}; move {x0},{y0} {ms}; up")
        self.level += 1
        return self

    def pinch(self, ms=250):
        self.parts.append(f"pinch 0.5,0.5 0.6,0.15 {ms}")
        self.level = max(0, self.level - 1)
        return self

    def text(self):
        return "; ".join(self.parts)


def scripts(cfg):
    S = lambda: Script(cfg)
    out = {}
    s = S()
    for _ in range(6):
        s.next().wait(120).back().wait(120)
    out["tap-alt120"] = s
    s = S()
    for _ in range(8):
        s.next().wait(60).back().wait(60)
    out["tap-alt60"] = s
    out["tap-chain"] = S().next().wait(450).next().wait(450).next().wait(450).back().wait(250).back().wait(250).back()
    out["tap-burst"] = S().next().wait(90).next().wait(90).next().wait(90).back().wait(90).back().wait(90).back()
    # 300 ms after the tap: the open starts ~120 ms after it, and the screen must be under the finger.
    s = S()
    for _ in range(3):
        s.next().wait(300).swipe(120, mid=True).wait(300)
    out["g-swipe-mid-push"] = s
    s = S().next().wait(900)
    for _ in range(2):
        s.swipe(150, 0.6).wait(90).regrab().wait(900)
    out["g-regrab"] = s.swipe()
    out["g-cancel-next"] = S().next().wait(900).swipe(350, 0.25).wait(60).next().wait(900).back().wait(900).swipe()
    s = S().next().wait(900)
    for _ in range(2):
        s.swipe().wait(80).next().wait(900)
    out["g-swipe-then-next"] = s.back()
    # 350 ms apart: sooner, a swipe lands on the screen still closing (a re-grab: g-regrab's case).
    out["g-deep-swipes"] = S().next().wait(800).next().wait(800).next().wait(800).swipe().wait(350).swipe().wait(350).swipe()
    # Ten deep and back (screens far down the stack are paused), then scroll the list and open card 3
    # with the bar (it starts wherever the card is): its flight must start on the card.
    s = S()
    for _ in range(10):
        s.next().wait(70)
    s.wait(300)
    for _ in range(10):
        s.back().wait(70)
    s.parts.append("wait 2500; down 0.5,0.85; move 0.5,0.7 400; hold 300; up; wait 5000")
    out["t-deep-scroll-open"] = s.tap(NEXT)
    s.level = 1
    # Deep, then back taps faster than a close takes (two closes overlapping each time).
    s = S()
    for _ in range(8):
        s.next().wait(450)
    s.wait(600)
    for _ in range(8):
        s.back().wait(240)
    out["t-fast-pops"] = s
    # A shuffled screen's side (and so its swipe) is random: only taps are scripted for it.
    if cfg["motion"] == "shuffle":
        out = {k: v for k, v in out.items() if not k.startswith("g-")}
    if is_zoom(cfg):
        s = S()
        for _ in range(3):
            s.next().wait(250).pinch().wait(300)
        out["z-pinch-mid-open"] = s
        out["z-pinch-chain"] = S().next().wait(800).next().wait(800).pinch().wait(120).pinch()
    return out


HARNESS = os.path.dirname(os.path.dirname(HERE))
TESTS = os.path.join(HARNESS, ".argent", "e2e", "spam")
CHECKS = os.path.join(HARNESS, "e2e", "argent", "spam")
APP = "com.eds2002.harness"


def finger_events(script):
    out = subprocess.run([sys.executable, "-I", os.path.join(HERE, "..", "finger.py"), script],
                         capture_output=True, text=True, check=True)
    return json.loads(out.stdout)


def yaml_event(e):
    keys = ["type", "x", "y"] + [k for k in ("x2", "y2") if k in e]
    fields = ", ".join(f"{k}: {round(e[k], 4) if isinstance(e[k], float) else e[k]}" for k in keys)
    return f"        - {{ {fields}, delayMs: {round(e.get('delayMs', 16), 1)} }}"


def emit(want, configs_filter, scripts_filter):
    """Writes every selected run as an Argent e2e test (.argent/e2e/spam/<run>.yaml) and its check
    (e2e/argent/spam/check-<run>.mjs). Clears the earlier ones first, so the folder is the matrix."""
    os.makedirs(TESTS, exist_ok=True)
    for d, test in ((TESTS, lambda f: f.endswith(".yaml")), (CHECKS, lambda f: f.startswith("check-"))):
        for f in os.listdir(d):
            if test(f):
                os.remove(os.path.join(d, f))
    n = 0
    for cfg in configs():
        if not want(cfg["name"], configs_filter):
            continue
        for sname, s in scripts(cfg).items():
            if not want(sname, scripts_filter):
                continue
            run = f"{cfg['name']}--{sname}"
            url = f"harness://lab/{cfg['lab']}?{cfg['query']}&marker=1"
            steps = [
                f"# Generated by e2e/scenarios/spam-matrix.py --emit ({cfg['lab']}: {cfg['query']}).",
                f"# Finger script: {s.text()}",
                "steps:",
                f"  - launch: {APP}",
                f"  - tool: open-url\n    args:\n      url: \"{url}\"",
                "  - script: { path: ../../../e2e/argent/spam/wait.mjs, timeout: 20000 }",
                "  - script: { path: ../../../e2e/argent/spam/record.mjs }",
                "  - tool: gesture-custom\n    args:\n      events:\n" + "\n".join(yaml_event(e) for e in finger_events(s.text())),
                "  - wait: 3000",
                f"  - script: {{ path: ../../../e2e/argent/spam/check-{run}.mjs, timeout: 120000 }}",
            ]
            open(os.path.join(TESTS, f"{run}.yaml"), "w").write("\n".join(steps) + "\n")
            open(os.path.join(CHECKS, f"check-{run}.mjs"), "w").write(
                f"// Generated by spam-matrix.py --emit: stop recording and check {run}.\n"
                'import { finishSpam } from "./lib.mjs";\n\n'
                f"finishSpam({json.dumps(run)}, {{ track: {json.dumps(cfg['track'])}, level: {s.level} }});\n")
            n += 1
    print(f"{n} tests in {os.path.relpath(TESTS, HARNESS)}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--configs", default="")
    ap.add_argument("--scripts", default="")
    ap.add_argument("--out", default=os.path.join(HERE, "..", "results", "spam", "matrix.jsonl"))
    ap.add_argument("--emit", action="store_true", help="write the runs as Argent e2e tests instead of running them")
    ap.add_argument("--platform", choices=("ios", "android"), default="ios", help="where card 3 is tapped")
    ap.add_argument("--no-track", action="store_true",
                    help="end state only, no frame-by-frame tracking (emulators draw and record at ~15 fps)")
    args = ap.parse_args()
    if args.no_track:
        TRACKING[0] = False
    if args.platform == "android":
        CARD3.update(CARD3_ANDROID)
    want = lambda name, filt: not filt or any(f in name for f in filt.split(","))
    if args.emit:
        return emit(want, args.configs, args.scripts)
    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    flagged = []
    with open(args.out, "a") as log:
        dead = 0
        for cfg in configs():
            if not want(cfg["name"], args.configs):
                continue
            for sname, s in scripts(cfg).items():
                if not want(sname, args.scripts):
                    continue
                run = f"{cfg['name']}--{sname}"
                res = subprocess.run([os.path.join(HERE, "spam.sh"), cfg["lab"], cfg["query"], run, s.text(), "3"],
                                     capture_output=True, text=True)
                try:
                    r = json.loads(res.stdout.strip().splitlines()[-1])
                except Exception:
                    r = {"name": run, "error": res.stdout[-300:] + res.stderr[-300:]}
                r["expect_level"] = s.level
                log.write(json.dumps(r) + "\n")
                log.flush()
                ev = (r.get("marker") or {}).get("events", {}) if cfg["track"] else {}
                st = r.get("state") or {}
                path = st.get("path") or ""
                level = 0 if path.endswith("List") else max(st.get("levels") or [0])
                # A run that produced no result (no device, no recording) is not a pass.
                bad = (["NO-RESULT"] if "error" in r else []) + [k for k, v in ev.items() if v] + (
                    ["errors"] if st.get("errors") else []) + (
                    ["unsettled"] if st.get("settled") is False else []) + (["end"] if level != s.level else [])
                print(f"{'FLAG' if bad else 'ok  '} {run:58s} {' '.join(bad):28s} end={path}@{level} want={s.level}", flush=True)
                if bad:
                    flagged.append(run)
                dead = dead + 1 if "error" in r else 0
                if dead >= 3:
                    sys.exit(f"stopping: {dead} runs in a row produced no result (is the device up?)")
    print(f"\n{len(flagged)} flagged")


if __name__ == "__main__":
    main()
