# Agent guide

How to work on this repo as a coding agent. CONTRIBUTING.md has the full human workflow.

## Layout

- `packages/react-native-screen-transitions`: the published library (source in `src/`, tests in
  `src/__tests__/`).
- `apps/harness`: Expo app with one lab per library mechanism (`labs/`), and the visual e2e suite
  (`e2e/`, see `e2e/README.md`). It bundles the library from source.
- `packages/docs`: the documentation site.

## Commands (repo root)

```sh
bun run typecheck
bun run lint
bun test                # unit tests, one shared process
bun run test:harness    # frame-by-frame harness tests, one process per file
bun run test            # both
bun run knip            # unused exports and files
```

## The bar

Every change has to clear three bars. They apply to new work as it lands: a feature isn't done
until it has runs, render checks and perf numbers of its own.

1. **Visually correct, even under spam.** The library is built to survive users hammering it: rapid
   taps, pushes during pops, grabs mid-animation, gestures fighting each other. Any visual error
   during spam (a blank, a flicker, a jump, a pop-in, a burst, a wrong end state) is a **failure**,
   never noise. Every mechanism gets spam runs in the e2e suite, not just the clean path, and they
   must cover all three inputs, alone and mixed:
   - **push spam:** rapid pushes, pushes landing mid-push and mid-pop;
   - **pop spam:** rapid pops, pops landing mid-push and mid-pop, popping several at once;
   - **gesture spam:** grabbing mid-transition, dismiss-then-regrab, flicking back and forth,
     releasing at every point of a drag, gestures racing a push or pop.

   **What counts as a jump.** Under spam the system is overloaded, so uneven speed is fine: a big
   step after a dropped frame, a hard brake, a sharp turnaround. A jump is a trajectory that doesn't
   make sense: a frame going backwards against the direction of travel, snapping back to an old
   position, or appearing somewhere the motion couldn't have reached. Those fail.

   **Every animation is interruptible.** A gesture can grab any transition, spring-back or snap at
   any frame, and a push, pop or snap can land in the middle of any gesture or its release. If
   interrupting causes a visual bug (the screen jumping to where the finger is, snapping back to an
   old position, a frame of the wrong state), that is an instant failure, same as spam.
2. **Render only what's needed.** A transition or gesture must not re-render screens, or
   components inside them, that didn't change. Motion belongs on the UI thread. Check it with
   Argent's React profiler (`react-profiler-start`, drive the scenario, `react-profiler-stop`, then
   `react-profiler-renders`) on a Debug build with Metro: push, pop, a gesture and a spam burst
   should show no renders beyond the screens whose content actually changed. Mounting stays minimal
   too: screens that aren't visible follow their `inactiveBehavior`.
3. **Lightweight.** Every per-frame cost counts: no new UI-thread mapper, reaction or layout-driven
   style unless the feature needs it, and opt-in where only some users need it. A change that touches
   motion, gestures, navigation or rendering needs a perf A/B against the base build (see below)
   showing it is the same or better.

## How behavior is verified

Behavior is verified **visually**, on iOS and Android. A change that affects motion, gestures or
navigation isn't done until the visual e2e suite passes on it:

1. Build the harness app in **Release** for a booted simulator (`xcodebuild ... -configuration Release`)
   or emulator (`./gradlew assembleRelease`, then `adb install`). Debug builds aren't representative.
2. Run `apps/harness/e2e/argent/run.sh <simulator UDID or adb serial> [name filter]`. It runs the
   Argent e2e tests (`apps/harness/.argent/e2e`), each recorded and analyzed frame by frame, and fails
   a test on a blank, a flicker or a wrong end state; open `apps/harness/e2e/results/argent/review.html`.
   One test: `cd apps/harness && argent e2e run <name> --device <id>`.
3. Look at every flagged event before calling it noise. Recorder gaps, misread frame stamps and a
   screen turning back at a reversal are known artifacts; anything else is a bug until shown otherwise.

When you fix a visual or gesture bug, add a run for it in `apps/harness/e2e/argent/build.py` and
regenerate the tests (`python3 apps/harness/e2e/argent/build.py`), so it can't come back unnoticed.
Don't edit the generated YAML or check scripts by hand. If the mechanism has no lab, add one in
`apps/harness/labs/`.

### Running the e2e suite

- **Rebuild after every JS change.** A Release app embeds its bundle, so it doesn't pick up edits.
  Rebuild, then reinstall (Argent `reinstall-app`) before running anything.
- **Keep the machine quiet during a run.** The analyzer reads frame timing, so another build, a
  second simulator or a screen recording during the suite produces gaps and jumps that aren't yours.
- **A flagged event is a failure until shown to be an analyzer artifact.** Event counts vary run to
  run (one spam test read 12, 18 and 20 jumps in three back-to-back runs), so rerun at least three
  times and compare against the base build on the same simulator to learn whether your change caused
  it. Either way it gets fixed: a base build with the same events means an existing bug, not a pass.
- **A new lab needs runs.** A lab without runs in `build.py` is only checked by hand, so add runs
  for its main paths (open, gesture dismiss, interruptions) and its push, pop and gesture spam paths
  (see the bar above) when you add the lab.

### Comparing against a base build (A/B)

When a change could affect motion or performance, measure it against the code before it:

1. Commit your work first, so restoring is one checkout.
2. Swap in the base library only, build it to its own derived data, then restore:
   ```sh
   git checkout <base> -- packages/react-native-screen-transitions/src
   (cd apps/harness/ios && xcodebuild -workspace Harness.xcworkspace -scheme Harness \
     -configuration Release -destination id=<udid> -derivedDataPath <dir>/base build)
   git checkout HEAD -- packages/react-native-screen-transitions/src
   git diff --cached --name-only --diff-filter=A | xargs git rm -q -f   # files the swap added
   ```
3. Run both builds on the same simulator in the same session, alternating (base, branch, base).
   The first run after a boot or install reads better than the rest, so a single base-then-branch
   pair can show a regression that isn't there.

**Performance:** the `perf` lab pushes and pops under extra UI-thread load and writes
`Documents/perf.json` (dropped UI and JS frames per load):
`harness://lab/perf?rounds=blank,blank,blank&loads=11,13,14,15&hz=60`. Average the rounds per
load. A difference of a couple of frames out of ~850 is noise, so call a regression only if it
shows up in every alternation.

### Physical iPhone

`expo run:ios` can't see a phone connected only over the network. Build with
`xcodebuild ... -configuration Release -destination 'generic/platform=iOS' -allowProvisioningUpdates`,
then `xcrun devicectl device install app --device <id> <Harness.app>` and
`xcrun devicectl device process launch --device <id> com.eds2002.harness`.

## Unit tests

Unit tests are for what a recording can't pin down:

- pure logic: gesture physics, snap and release targets, bounds/zoom math, route reconciliation;
- public API contracts;
- lifetimes and memory release;
- the frame-by-frame harness (`src/__tests__/harness`), which checks the same visual invariants in CI.

Don't write tests that pin implementation wiring (subscription identity, re-render counts, store
plumbing). They break on refactors and catch nothing a user would see. Never change a test just to
make it pass: find out whether the code or the test is wrong.

Tests share one `bun test` process: for per-file module mocks use `createModuleMock`
(`src/__tests__/helpers/mock-module.ts`), not `mock.module()`. Harness tests replace Reanimated for
their whole file and run in their own processes (`bun run test:harness`).

## Commits

Conventional commits (`fix(scope): …`, `feat`, `test`, `chore`, `docs`, `perf`), checked by
commitlint. Lefthook runs Biome on staged files.
