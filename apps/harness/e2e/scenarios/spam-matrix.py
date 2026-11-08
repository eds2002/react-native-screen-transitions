#!/usr/bin/env python3
"""
Tap and gesture spam over the boundary labs, each run checked frame by frame (spam.sh + marker.py).

  spam-matrix.py [--configs substr,...] [--scripts substr,...] [--out results.jsonl]

Configs are lab × recipe × motion × tree; scripts are finger scripts written per config (the swipe
that dismisses a screen depends on its motion and level). One JSON line per run goes to --out
(default e2e/results/spam/matrix.jsonl) and a table of the flagged runs is printed at the end.
"""
import argparse, json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
NEXT, BACK, SCROLL, UNDER = 0.1, 0.3, 0.5, 0.7
BAR_Y = 0.135
# card 3 on the unscrolled list (describe: sb-card-3, se-card-3)
CARD3 = {"shared-bounds": (0.809, 0.887), "shared-elements": (0.809, 0.829)}


def configs():
    out = []
    for lab, recipes in (("shared-bounds", ("styles", "zoom", "zoom-bound")), ("shared-elements", ("styles",))):
        for recipe in recipes:
            motions = ("slide", "diagonal", "swirl") if recipe == "styles" else ("still",)
            trees = (("flat", 1), ("below", 2), ("above", 2)) if recipe != "zoom-bound" else (("flat", 1),)
            for motion in motions:
                for tree, depth in trees:
                    q = f"recipe={recipe}&motion={motion}&tree={tree}&depth={depth}"
                    name = f"{'sb' if lab == 'shared-bounds' else 'se'}-{recipe}-{motion}-{tree}{depth}"
                    # sb zoom: the screen grows out of the card, there is no element to follow.
                    track = not (lab == "shared-bounds" and recipe == "zoom")
                    out.append({"lab": lab, "query": q, "name": name, "recipe": recipe, "motion": motion, "track": track})
    return out


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
        if self.cfg["recipe"] != "styles" or self.cfg["motion"] == "swirl":
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
    s = S()
    for _ in range(3):
        s.next().wait(180).swipe(120, mid=True).wait(300)
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
    out["g-deep-swipes"] = S().next().wait(800).next().wait(800).next().wait(800).swipe().wait(150).swipe().wait(150).swipe()
    if cfg["recipe"] != "styles":
        s = S()
        for _ in range(3):
            s.next().wait(250).pinch().wait(300)
        out["z-pinch-mid-open"] = s
        out["z-pinch-chain"] = S().next().wait(800).next().wait(800).pinch().wait(120).pinch()
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--configs", default="")
    ap.add_argument("--scripts", default="")
    ap.add_argument("--out", default=os.path.join(HERE, "..", "results", "spam", "matrix.jsonl"))
    args = ap.parse_args()
    want = lambda name, filt: not filt or any(f in name for f in filt.split(","))
    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    flagged = []
    with open(args.out, "a") as log:
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
                bad = [k for k, v in ev.items() if v] + (["errors"] if st.get("errors") else []) + (
                    ["unsettled"] if st.get("settled") is False else []) + (["end"] if level != s.level else [])
                print(f"{'FLAG' if bad else 'ok  '} {run:58s} {' '.join(bad):28s} end={path}@{level} want={s.level}", flush=True)
                if bad:
                    flagged.append(run)
    print(f"\n{len(flagged)} flagged")


if __name__ == "__main__":
    main()
