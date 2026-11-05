#!/usr/bin/env python3
"""
Generates the visual e2e suite as Argent e2e tests (apps/harness/.argent/e2e/<run>.yaml) from the
runs below, plus each run's check script (e2e/argent/check-<run>.mjs) and the path waits it uses
(e2e/argent/wait-<path>.mjs). Rerun after editing:  python3 e2e/argent/build.py

Every test: launch the harness, open its lab, wait until the lab settles, record, play the scenario,
then stop, analyze the recording (visual/analyze.py) and check the scenario's end state. Blanks,
flickers, jumps, pop-ins and a wrong end state fail the test; a run marked flaky only warns.

Coordinates are screen fractions that hold on every device: the stack lab's bar sits at a fixed
fraction (labs/stack.tsx), and finger scripts (e2e/finger.py) use fractions too.
"""
import json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
E2E = os.path.dirname(HERE)
HARNESS = os.path.dirname(E2E)
TESTS = os.path.join(HARNESS, ".argent", "e2e")
APP = "com.eds2002.harness"

PUSH = (0.74, 0.87)  # stack lab bar
POP = (0.26, 0.87)
SNAP_TO_2 = (0.56, 0.76)  # sheet lab, sheet at its first snap point

# Labs: (Home testID or deep link, the path it opens on; "settled" for labs with no navigator)
LABS = {
    "stack": ("open-stack", "A"),
    "gestures": ("open-gestures", "home"),
    "ownership": ("open-ownership", "home"),
    "heavy": ("open-heavy", "A"),
    "sheet": ("open-sheet", "Home"),
    "motion": ("harness://lab/motion", "settled"),
}

# The fixed spam bar most labs share (labs/ui.tsx SpamBar): button i of n at ((i + 0.5) / n, 0.135).
BAR_Y = 0.135


def bar(i, n):
    return ((i + 0.5) / n, BAR_Y)


def finger(script):
    """A finger script (see e2e/finger.py) as gesture-custom events."""
    out = subprocess.run([sys.executable, "-I", os.path.join(E2E, "finger.py"), script], capture_output=True, text=True, check=True)
    return json.loads(out.stdout)


def taps(points, gap):
    """Quick taps at points, gap ms apart, as one gesture (fast spam can't go through separate steps)."""
    ev = []
    for k, (x, y) in enumerate(points):
        ev.append({"type": "Down", "x": x, "y": y, "delayMs": 0 if k == 0 else max(0, gap - 40)})
        ev.append({"type": "Up", "x": x, "y": y, "delayMs": 40})
    return ev


# Steps: ("tap", testID) | ("gesture", events, comment) | ("wait", path) | ("sleep", ms)
def stack_spam(pairs, gap, mode):
    seq = ["push", "pop"] * pairs if mode == "alt" else (["push"] * 5 + ["pop"] * 5) * max(1, pairs // 5)
    steps = [("gesture", taps([PUSH if s == "push" else POP for s in seq], gap), f"{len(seq)} bar taps, {gap} ms apart ({mode})"), ("sleep", 500), ("wait", None)]
    # Fast taps can be lost before they reach the app: check against the presses that arrived.
    check = """const c = after.counts;
	const want = 1 + (c["bar-push"] ?? 0) - ((c["bar-pop"] ?? 0) - (c["bar-pop-ignored"] ?? 0));
	if (after.depth !== want) return `depth ${after.depth}, expected ${want} from the presses that arrived`;
	if (after.errors) return `${after.errors} errors`;"""
    return steps, check


def grab_mid_push(delay, mode):
    drag = "move 0.86,0.6 200; up" if mode == "letgo" else "move 0.99,0.6 90; up"
    steps = [("gesture", finger(f"down {PUSH[0]},{PUSH[1]}; hold 32; up; wait {delay}; down 0.8,0.6; {drag}"), f"push, then grab B {delay} ms in and {'let go' if mode == 'letgo' else 'fling it away'}"), ("sleep", 500), ("wait", None)]
    want = 2 if mode == "letgo" else 1
    check = f"""if (after.depth !== {want}) return `depth ${{after.depth}}, expected {want} ({'B open after letting go' if mode == 'letgo' else 'B dismissed'})`;"""
    return steps, check


def drag_after_dismiss(delay):
    steps = [
        ("tap", "stack-bar-push"), ("wait", "B"), ("tap", "stack-bar-push"), ("wait", "C"),
        ("gesture", finger(f"down 0.15,0.6; move 0.9,0.6 120; up; wait {delay}; down 0.15,0.6; move 0.35,0.6 400; hold 300; up"), f"fling C away, drag B {delay} ms later"),
        ("sleep", 1000), ("wait", "B"),
    ]
    check = """if ((after.counts["drag:B"] ?? 0) <= (before.counts["drag:B"] ?? 0)) return "B never started dragging after C was dismissed";"""
    return steps, check


def regrab_spring_back(delay):
    steps = [
        ("tap", "gestures-open-card"), ("wait", "card"), ("sleep", 300),
        ("gesture", finger(f"down 0.2,0.6; move 0.36,0.6 450; up; wait {delay}; down 0.3,0.6; move 0.4,0.6 400; up"), f"drag, let go, grab again {delay} ms later"),
        ("wait", "card"), ("sleep", 300),
        ("gesture", finger("down 0.1,0.6; move 0.95,0.6 250; up"), "swipe the card away"), ("wait", "home"),
    ]
    return steps, None


def ownership_spam(wait, pairs=4):
    spam = "".join(f"down 0.5,0.35; move 0.5,0.5 300; up; wait {wait}; down 0.2,0.6; move 0.35,0.6 300; up; wait {wait}; " for _ in range(pairs))
    steps = [
        ("tap", "ownership-open-l1"), ("wait", "L1/index"), ("tap", "ownership-open-l2"), ("wait", "L1/L2/index"), ("sleep", 300),
        ("gesture", finger(spam), f"short drags alternating ↓ (L1) and → (L2), {wait} ms apart"), ("sleep", 500), ("wait", "L1/L2/index"),
        ("gesture", finger("down 0.1,0.6; move 0.95,0.6 250; up"), "→ dismisses L2 alone"), ("wait", "L1/index"), ("sleep", 300),
        ("gesture", finger("down 0.5,0.3; move 0.5,0.95 250; up"), "↓ dismisses L1"), ("wait", "home"),
    ]
    return steps, None


def heavy_push(cost):
    return [("tap", f"heavy-push-{cost}"), ("wait", "B"), ("sleep", 300), ("tap", "heavy-b-pop"), ("wait", "A")], None


def sheet_regrab(delay, mode):
    if mode == "spring-back":
        g = finger(f"down 0.5,0.66; move 0.5,0.74 350; up; wait {delay}; down 0.5,0.7; move 0.5,0.76 300; up")
        what = f"drag the sheet down, let go, grab it again {delay} ms into the spring-back"
    else:
        g = finger(f"down {SNAP_TO_2[0]},{SNAP_TO_2[1]}; hold 32; up; wait {delay}; down 0.5,0.8; move 0.5,0.82 200; hold 150; up")
        what = f"snapTo(2), grab the sheet {delay} ms into it"
    steps = [("tap", "sheet-open-snap"), ("wait", "Snap"), ("sleep", 400), ("gesture", g, what), ("sleep", 500), ("wait", "Snap"), ("tap", "sheet-snap-close"), ("wait", "Home")]
    return steps, None


def fling(x0, y0, x1, y1, ms=90):
    return f"down {x0},{y0}; move {x1},{y1} {ms}; up"


def toggle_spam(n, open_i, close_i, pairs, gap, check, label):
    """Alternating open/close presses on the spam bar, gap ms apart, as one gesture."""
    seq = [bar(open_i, n), bar(close_i, n)] * pairs
    steps = [("gesture", taps(seq, gap), f"{len(seq)} {label} presses, {gap} ms apart"), ("sleep", 600), ("wait", None)]
    return steps, check


def race(first, script, comment, check, settle=None):
    """Steps before a timed finger script, then the script itself, then settle."""
    steps = list(first) + [("gesture", finger(script), comment), ("sleep", 600), ("wait", settle)]
    return steps, check


def tap_bar(i, n, then=""):
    x, y = bar(i, n)
    return f"down {x},{y}; hold 32; up" + (f"; {then}" if then else "")


ERRORS = 'if (after.errors) return `${after.errors} errors`;'
SCREEN = "const screen = (name) => after.screens.find((s) => s.n === name);"


def presence_check(note, unit):
    """A Presence unit: mounted and open when the last press asked for open, gone when closed."""
    return f"""{SCREEN}
	const want = after.notes["{note}"] ?? "closed";
	const s = screen("{unit}");
	// Open at any snap point: an "auto" sheet opens to its content height.
	if (want === "open" && (!s || s.c || s.p < 0.1)) return `{unit} ${{s ? "at " + s.p + (s.c ? " closing" : "") : "missing"}}, expected open`;
	if (want === "closed" && s) return `{unit} still mounted at ${{s.p}}, expected closed`;
	{ERRORS}"""



def progress_check(unit, expected):
    """A unit that stays mounted: its progress must end at `expected` (a JS expression)."""
    return f"""{SCREEN}
	const s = screen("{unit}");
	const want = {expected};
	if (!s) return "{unit} missing";
	if (Math.abs(s.p - want) > 0.06) return `{unit} at ${{s.p}}, expected ${{want}}`;
	if (s.c && want > 0) return "{unit} still closing";
	{ERRORS}"""


def at_a_stop_check(unit, stops):
    return f"""{SCREEN}
	const s = screen("{unit}");
	const stops = {json.dumps(stops)};
	if (!s) return "{unit} missing";
	if (!stops.some((p) => Math.abs(s.p - p) <= 0.06)) return `{unit} at ${{s.p}}, between stops ${{stops.join(", ")}}`;
	if (s.c) return "{unit} closing";
	{ERRORS}"""







PAGER_STOPS = [0.25, 0.5, 0.75, 1]


def pager_swipe_spam(gap):
    swipes = "".join(f"{fling(0.8, 0.25, 0.2, 0.25, 120)}; wait {gap}; {fling(0.2, 0.25, 0.8, 0.25, 120)}; wait {gap}; " for _ in range(4))
    return race([], swipes.rstrip("; "), f"8 swipes on the pager alternating left and right, {gap} ms apart", at_a_stop_check("pager", PAGER_STOPS))


def sheet_grab_mid_open(delay):
    script = tap_bar(0, 4, f"wait {delay}; " + fling(0.5, 0.9, 0.5, 0.99, 60))
    return race([], script, f"open the sheet, fling it down {delay} ms in", progress_check("sheet", "0"))


def presence_flick_reopen(delay):
    script = fling(0.5, 0.85, 0.5, 0.99) + f"; wait {delay}; " + tap_bar(2, 4)
    return race([("tap", "bar-presence-open"), ("wait", None), ("sleep", 300)], script, f"fling the presence down, reopen it {delay} ms later", presence_check("presence", "presence"))


X = ["--track", "x@0.7"]
Y = ["--track", "y@0.975"]
# name: (lab, (steps, check), analyzer options, flaky)
RUNS = {
    **{f"regrab-spring-back-{d}": ("gestures", regrab_spring_back(d), X, False) for d in (60, 100, 150)},
    **{f"stack-spam-alt-{g}": ("stack", stack_spam(25, g, "alt"), X, False) for g in (60, 100, 150, 250, 400)},
    "stack-spam-burst-100": ("stack", stack_spam(25, 100, "burst"), X, False),
    **{f"grab-mid-push-letgo-{d}": ("stack", grab_mid_push(d, "letgo"), X, False) for d in (40, 80, 120)},
    # A fling 120 ms into a push is sometimes not picked up as a gesture (parked).
    "grab-mid-push-dismiss-120": ("stack", grab_mid_push(120, "dismiss"), X, True),
    "grab-mid-push-dismiss-180": ("stack", grab_mid_push(180, "dismiss"), X, False),
    **{f"drag-after-dismiss-{d}": ("stack", drag_after_dismiss(d), X, False) for d in (30, 60, 120)},
    **{f"ownership-spam-{w}": ("ownership", ownership_spam(w), X + Y, False) for w in (400, 150, 50)},
    **{f"heavy-push-{c}": ("heavy", heavy_push(c), X, False) for c in (0, 150, 400, 800)},
    **{f"sheet-spring-back-{d}": ("sheet", sheet_regrab(d, "spring-back"), Y, False) for d in (60, 150)},
    **{f"sheet-during-snap-{d}": ("sheet", sheet_regrab(d, "during-snap"), Y, False) for d in (60, 150, 250)},
    # No navigator (motion lab): open/close spam on a sheet unit and a Presence, gestures racing them.
    **{f"motion-sheet-spam-{g}": ("motion", toggle_spam(4, 0, 1, 15, g, progress_check("sheet", '(after.notes.sheet ?? "closed") === "open" ? 0.4 : 0'), "sheet open/close"), Y, False) for g in (60, 150)},
    **{f"motion-presence-spam-{g}": ("motion", toggle_spam(4, 2, 3, 15, g, presence_check("presence", "presence"), "presence open/close"), Y, False) for g in (60, 150)},
    **{f"motion-sheet-grab-mid-open-{d}": ("motion", sheet_grab_mid_open(d), Y, False) for d in (80, 200)},
    **{f"motion-presence-flick-reopen-{d}": ("motion", presence_flick_reopen(d), Y, False) for d in (40, 150)},
    **{f"motion-pager-swipe-spam-{g}": ("motion", pager_swipe_spam(g), Y, False) for g in (60, 150)},
}


def slug(path):
    # Filenames: macOS ignores case, and the sheet lab's "Home" isn't the gestures lab's "home".
    return "".join(f"_{c.lower()}" if c.isupper() else c for c in path).replace("/", "-")


def yaml_events(events):
    return "\n".join(f"        - {{ type: {e['type']}, x: {e['x']}, y: {e['y']}, delayMs: {e.get('delayMs', 16)} }}" for e in events)


def write_test(name, lab, steps, check, analyze, flaky, waits):
    open_id, start = LABS[lab]
    waits.add(start)
    if open_id.startswith("harness://"):
        opening = [f"  - tool: open-url\n    args:\n      url: {open_id}"]
    else:
        opening = [f"  - await: {{ visible: {{ id: {open_id} }}, timeout: 10000 }}", f"  - tap: {{ id: {open_id} }}"]
    out = [
        f"# Generated by e2e/argent/build.py ({lab} lab). Edit the run there, then rerun build.py.",
        "steps:",
        f"  - launch: {APP}",
        *opening,
        f"  - script: {{ path: ../../e2e/argent/wait-{slug(start)}.mjs, timeout: 20000 }}",
        "  - script: { path: ../../e2e/argent/record-start.mjs }",
    ]
    for step in steps:
        kind = step[0]
        if kind == "tap":
            out.append(f"  - tap: {{ id: {step[1]} }}")
        elif kind == "sleep":
            out.append(f"  - wait: {step[1]}")
        elif kind == "wait":
            path = step[1] or "settled"
            waits.add(path)
            out.append(f"  - script: {{ path: ../../e2e/argent/wait-{slug(path)}.mjs, timeout: 20000 }}")
        elif kind == "gesture":
            out.append(f"  # {step[2]}")
            out.append("  - tool: gesture-custom\n    args:\n      events:\n" + yaml_events(step[1]))
    out.append(f"  - script: {{ path: ../../e2e/argent/check-{name}.mjs, timeout: 120000 }}")
    open(os.path.join(TESTS, f"{name}.yaml"), "w").write("\n".join(out) + "\n")
    body = check or "return null;"
    js = f"""// Generated by build.py: stop recording, analyze, and check {name}.
import {{ finish }} from "./lib.mjs";

finish("{name}", {{
	analyze: {json.dumps(analyze)},
	flaky: {json.dumps(flaky)},
	check: (before, after) => {{
	{body}
		return null;
	}},
}});
"""
    open(os.path.join(HERE, f"check-{name}.mjs"), "w").write(js)


def main():
    os.makedirs(TESTS, exist_ok=True)
    for d, prefix in ((TESTS, ""), (HERE, "check-"), (HERE, "wait-")):
        for f in os.listdir(d):
            if f.startswith(prefix) and (f.endswith(".yaml") or (prefix and f.endswith(".mjs"))):
                os.remove(os.path.join(d, f))
    waits = set()
    for name, (lab, (steps, check), analyze, flaky) in RUNS.items():
        write_test(name, lab, steps, check, analyze, flaky, waits)
    for path in sorted(waits):
        target = "" if path == "settled" else path
        open(os.path.join(HERE, f"wait-{slug(path)}.mjs"), "w").write(
            f"""// Generated by build.py: wait until every screen settled{f' on {path}' if target else ''}.
import {{ waitSettled }} from "./lib.mjs";

waitSettled({json.dumps(target)});
"""
        )
    print(f"{len(RUNS)} tests in {os.path.relpath(TESTS, HARNESS)}, {len(waits)} wait scripts")


main()
