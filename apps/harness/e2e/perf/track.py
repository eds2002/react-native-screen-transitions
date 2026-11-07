#!/usr/bin/env python3
"""Runs the perf lab's track suite on one device and records it against the current commit.

    python3 -I e2e/perf/track.py <device> [--hz N] [--fractions 0,.5,.65,.8] [--note TEXT] [--no-record]
    python3 -I e2e/perf/track.py --show [device name]

<device> is a booted iOS simulator UDID, a physical iPhone's devicectl identifier or name, or an adb
serial. The device needs the Release harness installed (Debug numbers are not comparable).

The suite (labs/perf.tsx, ?suite=track) pushes and pops through the blank stack slide, zoom, zoom to a
bound and a styles() morph, with @react-navigation/stack as the same-run reference, twice each at UI
loads of 0/50/65/80 % of a refresh (0/85/90/95 % on Android, whose UI thread has more headroom), then mounts 300 boundaries (and 300 plain Views). It takes about
ten minutes and needs nothing driving it. Results:
  e2e/results/perf/<stamp>-<device>.json   the lab's raw output (not committed)
  e2e/perf/history.jsonl                   one line per run: commit, device, summary (committed)

Reading it: `drops` are UI frames dropped per 20 transitions, averaged over the two rounds. At load 0
everything should be 0; the 65 % and 80 % columns show how much of a frame the transitions leave.
`js` runs in the same session, so compare a kind's drops to js's when two runs' loads differ in noise.
Mount ms are medians of 8 cycles. Simulator runs vary by about ±1 drop per cell and ±10 % mount ms;
treat a change as real when it repeats.
"""

import json
import os
import random
import re
import subprocess
import sys
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path

APP = "com.eds2002.harness"
HARNESS = Path(__file__).resolve().parents[2]
REPO = HARNESS.parents[1]
HISTORY = HARNESS / "e2e" / "perf" / "history.jsonl"
RESULTS = HARNESS / "e2e" / "results" / "perf"
TIMEOUT_S = 30 * 60
POLL_S = 15


def run(*cmd, check=True, quiet=False):
    out = subprocess.run(cmd, capture_output=True, text=True)
    if check and out.returncode != 0:
        if not quiet:
            sys.stderr.write(out.stdout + out.stderr)
        raise SystemExit(f"failed: {' '.join(cmd)}")
    return out.stdout


def adb_path():
    home = os.environ.get("ANDROID_HOME") or os.path.expanduser("~/Library/Android/sdk")
    candidate = os.path.join(home, "platform-tools", "adb")
    return candidate if os.path.exists(candidate) else "adb"


ADB = adb_path()


class Target:
    """One device: how to start the suite there and how to read its results back."""

    def __init__(self, ident):
        self.ident = ident
        sims = json.loads(run("xcrun", "simctl", "list", "devices", "booted", "-j"))["devices"]
        booted = {d["udid"]: d["name"] for ds in sims.values() for d in ds}
        if ident in booted:
            self.kind, self.name, self.hz = "ios-sim", booted[ident], 60
            return
        adb = run(ADB, "devices", check=False)
        if re.search(rf"^{re.escape(ident)}\s+device$", adb, re.M):
            self.kind = "android"
            model = run(ADB, "-s", ident, "shell", "getprop", "ro.product.model").strip()
            avd = run(ADB, "-s", ident, "emu", "avd", "name", check=False).splitlines()
            self.name = avd[0].strip() if avd and avd[0].strip() and ident.startswith("emulator-") else model
            rate = re.search(r"refreshRate=([\d.]+)", run(ADB, "-s", ident, "shell", "dumpsys", "display", check=False))
            self.hz = round(float(rate.group(1))) if rate else 60
            return
        with tempfile.NamedTemporaryFile(suffix=".json") as f:
            run("xcrun", "devicectl", "list", "devices", "-j", f.name, quiet=True)
            devices = json.load(open(f.name))["result"]["devices"]
        for d in devices:
            ids = {d.get("identifier"), d["hardwareProperties"].get("udid"), d["deviceProperties"].get("name")}
            if ident in ids:
                self.kind, self.ident, self.name, self.hz = "ios-device", d["identifier"], d["deviceProperties"]["name"], 120
                return
        raise SystemExit(f"no booted simulator, adb device or paired iPhone named {ident}")

    def start(self, url):
        if self.kind == "ios-sim":
            run("xcrun", "simctl", "terminate", self.ident, APP, check=False)
            container = run("xcrun", "simctl", "get_app_container", self.ident, APP, "data").strip()
            (Path(container) / "Documents" / "perf.json").unlink(missing_ok=True)
            run("xcrun", "simctl", "openurl", self.ident, url)
        elif self.kind == "android":
            run(ADB, "-s", self.ident, "shell", "am", "force-stop", APP)
            run(ADB, "-s", self.ident, "logcat", "-c")
            run(ADB, "-s", self.ident, "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", f"'{url}'", APP)
        else:
            out = subprocess.run(["xcrun", "devicectl", "device", "process", "launch", "--device", self.ident, "--terminate-existing", "--payload-url", url, APP], capture_output=True, text=True)
            if out.returncode != 0:
                locked = "Locked" in out.stdout + out.stderr
                raise SystemExit("the iPhone is locked: unlock it (auto-lock off for the run) and retry" if locked else out.stdout + out.stderr)

    def read(self, started_at):
        """The suite's results once it has finished, else None."""
        if self.kind == "ios-sim":
            container = run("xcrun", "simctl", "get_app_container", self.ident, APP, "data").strip()
            path = Path(container) / "Documents" / "perf.json"
            return json.loads(path.read_text()) if path.exists() else None
        if self.kind == "android":
            log = run(ADB, "-s", self.ident, "logcat", "-d", "-s", "ReactNativeJS:I", "-v", "raw")
            chunks = {}
            total = 0
            for m in re.finditer(r"HARNESS_PERF (\d+)/(\d+) (.*)", log):
                chunks[int(m.group(1))] = m.group(3)
                total = int(m.group(2))
            if not total or len(chunks) < total:
                return None
            return json.loads("".join(chunks[i] for i in range(1, total + 1)))
        with tempfile.TemporaryDirectory() as tmp:
            dest = Path(tmp) / "perf.json"
            out = subprocess.run(
                ["xcrun", "devicectl", "device", "copy", "from", "--device", self.ident, "--domain-type", "appDataContainer",
                 "--domain-identifier", APP, "--source", "Documents/perf.json", "--destination", str(dest)],
                capture_output=True, text=True)
            if out.returncode != 0 or not dest.exists():
                return None
            data = json.loads(dest.read_text())
            at = datetime.fromisoformat(data["at"].replace("Z", "+00:00")).timestamp()
            return data if at > started_at else None


def summarize(data):
    """drops[kind][load] (mean UI frames dropped per round), jsDrops likewise, mount medians."""
    drops, late, js = {}, {}, {}
    mount = {}
    for r in data["results"]:
        if "ui" in r:
            key = f'{r["load"]:g}'
            drops.setdefault(r["kind"], {}).setdefault(key, []).append(r["ui"]["dropped"])
            late.setdefault(r["kind"], {}).setdefault(key, []).append(r["ui"]["late"])
            js.setdefault(r["kind"], {}).setdefault(key, []).append(r["js"]["dropped"])
        else:
            mount[r["kind"]] = {"commit": r["commit"], "frame": r["frame"]}
    mean = lambda table: {k: {l: round(sum(v) / len(v), 1) for l, v in loads.items()} for k, loads in table.items()}
    return {"drops": mean(drops), "late": mean(late), "jsDrops": mean(js), "mount": mount}


def git(*args):
    return run("git", "-C", str(REPO), *args).strip()


def print_summary(record, previous=None):
    s, p = record["summary"], previous["summary"] if previous else None
    print(f'\n{record["device"]} ({record["platform"]}, {record["hz"]} Hz)  {record["commit"][:8]}{" +dirty" if record["dirty"] else ""}  {record["date"]}')
    if p:
        print(f'  vs {previous["commit"][:8]} {previous["date"]}: now (before)')
    loads = record["loads"]
    print("  UI drops / 20 transitions   " + "".join(f"{l:>12}" for l in [f"{x:g} ms" for x in loads]))
    for kind, row in s["drops"].items():
        cells = []
        for load in loads:
            key = f"{load:g}"
            now = row.get(key)
            cell = "-" if now is None else f"{now:g}"
            if p:
                before = p["drops"].get(kind, {})
                # Loads are refresh fractions, so match columns by position across runs.
                bkeys = list(before.keys())
                idx = loads.index(load)
                if idx < len(bkeys):
                    cell += f" ({before[bkeys[idx]]:g})"
            cells.append(cell)
        print(f"  {kind:<28}" + "".join(f"{c:>12}" for c in cells))
    for kind, m in s["mount"].items():
        line = f'  {kind + " 300 (ms)":<28}{"commit " + str(m["commit"]):>12}{"frame " + str(m["frame"]):>12}'
        if p and kind in p["mount"]:
            line += f'   before {p["mount"][kind]["commit"]}/{p["mount"][kind]["frame"]}'
        print(line)


def history():
    if not HISTORY.exists():
        return []
    return [json.loads(line) for line in HISTORY.read_text().splitlines() if line.strip()]


def main():
    args = sys.argv[1:]
    if not args or args[0] in ("-h", "--help"):
        print(__doc__)
        return
    if args[0] == "--show":
        name = " ".join(args[1:])
        rows = [r for r in history() if not name or r["device"] == name]
        for prev, r in zip([None] + rows[:-1], rows):
            print_summary(r, prev if prev and prev["device"] == r["device"] else None)
        return
    target = Target(args[0])
    opt = lambda flag: args[args.index(flag) + 1] if flag in args else None
    hz = int(opt("--hz") or target.hz)
    # The emulator's UI thread does a transition frame in about 1.5 ms (drops start at 16 ms of load), so
    # loads under 85 % of a refresh tell nothing apart there.
    fractions = opt("--fractions") or ("0,.85,.9,.95" if target.kind == "android" else None)
    url = f"harness://lab/perf?suite=track&hz={hz}" + (f"&fractions={fractions}" if fractions else "") + f"&n={random.randint(0, 1 << 30)}"
    commit, dirty = git("rev-parse", "HEAD"), bool(git("status", "--porcelain", "--", "packages/react-native-screen-transitions/src"))
    print(f"{target.name} ({target.kind}, {hz} Hz): {url}")
    started_at = time.time()
    target.start(url)
    data = None
    while data is None:
        if time.time() - started_at > TIMEOUT_S:
            raise SystemExit("timed out waiting for the suite")
        time.sleep(POLL_S)
        data = target.read(started_at)
    if data.get("error"):
        raise SystemExit(f'suite failed: {data["error"]}')
    RESULTS.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    raw = RESULTS / f'{stamp}-{re.sub(r"[^A-Za-z0-9_-]", "_", target.name)}.json'
    raw.write_text(json.dumps(data, indent=1))
    record = {
        "date": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M"),
        "commit": commit,
        "subject": git("log", "-1", "--format=%s"),
        "dirty": dirty,
        "device": target.name,
        "platform": target.kind,
        "hz": hz,
        "loads": data["loads"],
        "note": opt("--note") or "",
        "summary": summarize(data),
    }
    same = [r for r in history() if r["device"] == record["device"]]
    print_summary(record, same[-1] if same else None)
    print(f"\nraw: {raw}")
    if "--no-record" not in args:
        HISTORY.parent.mkdir(parents=True, exist_ok=True)
        with HISTORY.open("a") as f:
            f.write(json.dumps(record) + "\n")
        print(f"recorded in {HISTORY.relative_to(REPO)}")


if __name__ == "__main__":
    main()
