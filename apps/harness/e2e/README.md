# Harness e2e

Argent-driven scenarios against the Release harness app on an iOS simulator. The
pass bar is what is on screen: every run is recorded and checked frame by frame
for blanks, flickers and jumps; the app's state is a second check.

```sh
# Release build on the simulator, then (app installed, any screen):
apps/harness/e2e/run-all.sh <udid> apps/harness/e2e/results/<name> [name filter]
open apps/harness/e2e/results/<name>/review.html
```

`review.html` lists every run (did its end state check pass, events per kind) and
every flagged event as a strip of the frames around it, flagged frames outlined in
red. `results/` is gitignored.

## How a run is checked

The app paints `#ff00ff` (BLANK, `labs/stamp.tsx`) behind every screen and draws
a frame stamp in the bottom-left corner: two rows of cells updated on the UI
thread every frame. `visual/record.sh` records the simulator while a scenario
runs; `visual/analyze.py` reads every recorded frame at point resolution, orders
them by the stamp, drops repeated captures, and flags:

| kind | meaning | failure |
|---|---|---|
| blank | BLANK pixels: part of the window has no screen over it | yes |
| flicker | a frame unlike both neighbours while they match each other | yes |
| jump | a tracked screen edge steps far off its path in one frame | yes |
| pop-in | a screen edge first appears well inside the window and keeps moving: a screen became visible part-way through its transition | yes |
| burst | far more pixels change in one frame than around it | yes |
| hitch | a jump-sized step across dropped frames (a stutter, not a wrong position) | no |
| reversal | a "flicker" that is a tracked screen changing direction | no |

`--track x@0.7` follows where screen backgrounds meet along the row at 70% of the
height (horizontal motion); `y@0.975` along the column in the right margin
(vertical motion). Only long runs of one colour count as a screen background, so
text and buttons don't make edges; every lab screen has its own solid colour.
Pick a line that crosses screen backgrounds only.

## Driving the app

| script | does |
|---|---|
| `state.sh <udid>` | the debug bridge summary (`labs/bridge.tsx`) as JSON: lab, path, depth, settled, screens, errors, counts |
| `wait-settled.sh <udid> [path] [s]` | waits until every screen has settled (and the focused path matches) |
| `tap.sh <udid> <testID>` / `locate.sh` | taps / prints the centre of an element by testID |
| `gesture.sh <udid> "<finger script>"` | plays `finger.py` scripts: `down x,y; move x,y ms; hold ms; up; wait ms`, one move per 16 ms |

Fast taps can be lost on the way into the app (under ~100 ms apart), so the spam
scenario checks the stack depth against the presses the app counted
(`bridge.count`), not the presses sent.

## Scenarios

| scenario | covers |
|---|---|
| `regrab-spring-back.sh <ms>` | gestures lab: drag a card, let go (springs back), grab again `<ms>` later |
| `stack-spam.sh <pairs> <ms> alt\|burst` | stack lab: push/pop through the fixed bar, `<ms>` apart (the cooldown sweep) |
| `stack-grab-mid-push.sh <ms> letgo\|dismiss` | stack lab: grab the incoming screen `<ms>` into a push; let go, or fling it away (dismiss needs `<ms>` ≥ ~120, earlier the screen is still under the right edge) |
| `ownership-spam.sh <ms>` | ownership lab, L1 (↓) → L2 (→): short drags alternating owners `<ms>` apart, then → dismisses L2 and ↓ dismisses L1 |
| `heavy-push.sh <cost>` | heavy lab: push a screen that burns `<cost>` ms on its first render; it must enter from the edge (no `pop-in`, no blank) |
| `sheet-regrab.sh <ms> spring-back\|during-snap` | sheet lab: grab during the spring-back, or during a `snapTo` animation |

`run-all.sh` lists every run with its parameters and analyzer options.

## Showing a bug

`visual/clip.py <spec.json>... --out clip.mp4` cuts an annotated clip from a
recorded run: a title card, the moment at real speed, then slowed down
(time-accurate, so dropped frames stay visible) with a caption per phase,
flagged frames outlined, an optional magnified panel and marker line, and a
before/after flip. The spec format is in the script's docstring.
