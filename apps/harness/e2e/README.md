# Harness e2e

[Argent e2e](https://github.com/software-mansion/argent) tests against the Release harness app on
an iOS simulator or Android emulator. The pass bar is what is on screen: every run is recorded and
checked frame by frame for blanks, flickers and jumps; the app's state is a second check.

```sh
# Release build installed on a booted simulator or emulator, then:
apps/harness/e2e/argent/run.sh <simulator UDID or adb serial> [name filter]
open apps/harness/e2e/results/argent/review.html

# or one test, straight through Argent:
cd apps/harness && argent e2e run stack-spam-alt-60 --device <id>
```

The tests are YAML in `apps/harness/.argent/e2e/`, generated from the runs in
`e2e/argent/build.py` (edit a run there, then `python3 e2e/argent/build.py`). Each test launches the
harness, opens its lab, starts recording (`record-start.mjs`), plays the scenario with Argent
directives and `gesture-custom` finger scripts, then its `check-<run>.mjs` stops the recording, runs
the analyzer and checks the end state. A blank, a flicker or a wrong end state fails the test; a run
marked flaky only warns. Script steps take no arguments, so the device comes from
`apps/harness/.argent/device` (run.sh writes it) or the only booted device.

`review.html` lists every run (did its end state check pass, events per kind) and
every flagged event as a strip of the frames around it, flagged frames outlined in
red. `results/` is gitignored.

## Android

`argent/run.sh` drives an Android emulator or device too: pass its adb serial (`emulator-5554`)
instead of a simulator UDID. Build and install the Release APK first:

```sh
cd apps/harness && npx expo prebuild --platform android
cd android && ./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
adb -s emulator-5554 install -r app/build/outputs/apk/release/app-release.apk
```

On Android, `argent/lib.mjs` (and `visual/record.sh`) record with `adb shell screenrecord` at half
the screen's resolution (in its own shape) and pass the analyzer the window size in dp.

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
| jump | a tracked screen edge takes a step that stands out from the steps on both sides (a leap, or snapping somewhere and carrying on); sharp braking and turning around are not jumps | yes |
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

Defined in `e2e/argent/build.py` (one function each, one test per parameter):

| scenario | covers |
|---|---|
| `regrab-spring-back-<ms>` | gestures lab: drag a card, let go (springs back), grab again `<ms>` later |
| `stack-spam-alt-<ms>`, `stack-spam-burst-100` | stack lab: push/pop through the fixed bar, `<ms>` apart; the stack depth must match the presses that arrived |
| `grab-mid-push-letgo\|dismiss-<ms>` | stack lab: grab the incoming screen `<ms>` into a push; let go, or fling it away (dismiss-120 is marked flaky) |
| `drag-after-dismiss-<ms>` | stack lab: fling C away, then drag B `<ms>` later; B must start dragging |
| `ownership-spam-<ms>` | ownership lab, L1 (↓) → L2 (→): short drags alternating owners `<ms>` apart, then → dismisses L2 and ↓ dismisses L1 |
| `heavy-push-<cost>` | heavy lab: push a screen that burns `<cost>` ms on its first render; it must enter from the edge (no `pop-in`, no blank) |
| `sheet-spring-back\|during-snap-<ms>` | sheet lab: grab during the spring-back, or during a `snapTo` animation |
| `motion-*` | motion lab (no navigator): open/close spam through the lab's fixed bar (`SpamBar`, y ≈ 0.135), gesture spam, and gestures racing an open; units report to the bridge with `ScreenReporter` and the last press asked for is in `notes` |

Taps inside timed gestures use screen fractions that hold on every device: the stack lab's bar sits
at a fixed fraction of the screen (push ≈ 0.74, 0.87; pop ≈ 0.26, 0.87).

## Frame drops

Gaps in a recording (`displayFrames` > 1, `hitch`) are mostly frames `simctl recordVideo`
didn't capture, not frames the app missed: 10 pushes and pops show ~14 % gaps on video
and 0–1 dropped frames in the app. Count drops in the app instead:

- the bridge summary has `perf: { frames, dropped, late, worst }`, from a UI-thread frame
  callback (dropped: a frame later than one refresh; late: over 1.25 refreshes; worst: ms)
- `harness://perf/reset` starts counting (opening a lab does too), `harness://perf/hz/120`
  for a 120 Hz device (60 Hz by default)
- `harness://bridge/0` stops the bridge's own reports while measuring (it re-renders a hidden
  view up to every 100 ms), `harness://bridge/1` turns them back on and refreshes the summary
- `harness://perf/load/<ms>` burns that many ms of the UI thread every frame: the load at which
  drops start is the headroom transitions leave (on the simulator: stack ~12 ms, zoom ~10 ms)
- `latency: { push, pop }`: median ms from a stack-bar press to the screen's first moving frame
- add `?n=<random>` to a link opened twice in a row, or the app doesn't see it again
- `harness://lab/perf?rounds=blank,js,native&loads=0,8,11&hz=60`: the same 10 pushes and pops through
  the blank stack, `@react-navigation/stack` (SlideFromRightIOS, same spring) and native stack, under each
  load; results on screen and in the app's `Documents/perf.json` (runs on a device with nothing driving it)
- `python3 threads.py <pid>`: CPU ms per thread of a simulator app (thread 0 is the main thread)

## Tracking perf per commit

`python3 -I perf/track.py <simulator UDID | iPhone name | adb serial>` runs the perf lab's track
suite (`harness://lab/perf?suite=track`: slide, zoom, zoom to a bound, styles() morph and
@react-navigation/stack twice each at loads of 0/50/65/80 % of a refresh, then 300 boundaries
mounted) on a Release build, about ten minutes with nothing driving it, and appends the
summary to `perf/history.jsonl` against the current commit. It prints the run next to the
previous one on the same device; `perf/track.py --show [device]` prints the history. Run the
simulator and the emulator one after the other (they share the Mac's CPU); a phone can run
alongside them, unlocked with auto-lock off.

## Showing a bug

`visual/clip.py <spec.json>... --out clip.mp4` cuts an annotated clip from a
recorded run: a title card, the moment at real speed, then slowed down
(time-accurate, so dropped frames stay visible) with a caption per phase,
flagged frames outlined, an optional magnified panel and marker line, and a
before/after flip. The spec format is in the script's docstring.
