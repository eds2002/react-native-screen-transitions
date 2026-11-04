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

## How behavior is verified

Behavior is verified **visually**. The bar: no blank spots, no flickers, no jumps, on iOS and
Android. A change that affects motion, gestures or navigation isn't done until the visual e2e suite
passes on it:

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
