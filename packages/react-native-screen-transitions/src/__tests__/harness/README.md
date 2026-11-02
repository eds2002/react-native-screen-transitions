# Transition harness

Runs the real BlankStack frame by frame and checks what every screen looks like
on every frame, so one generated catalog covers what would otherwise take
hundreds of hand-written cases.

## Pieces

| File | What it does |
|---|---|
| `reanimated-sim.ts` | Frame-accurate Reanimated/Worklets stand-in: shared values step animation objects (the library spring, `withTiming`, `withDelay`) on a fake 60 Hz clock; reactions re-run each frame; `scheduleOnRN`, `scheduleOnUI` and `requestAnimationFrame` hop threads in order. |
| `install.ts` | Installs the sim and stand-ins for `react-native`, gesture-handler (keeps every handler so they can be fired), safe-area-context and teleport. Call it first in a harness test. |
| `stack-harness.tsx` | Mounts the real `createBlankStackNavigator()` (screens can be nested stacks) and records per frame each screen's window rect (all ancestor transforms composed), opacity and touchability, its `styleId` elements and any overlays. Helpers: `push`, `pushIn` (nested), `navigate`, `goBack`, `replace`, `setOptions`, `tap` (React Native hit-testing, nearest `onPress`), `frame(s)`, `settle`. |
| `gesture-driver.ts` | Timed touches through the library's real pan/pinch handlers (manual activation, `onStart`/`onUpdate`/`onEnd`, simultaneous groups). Fingers ease in by default; `linear` is a constant-speed swipe (Maestro/Argent style). |
| `invariants.ts` | Rules every trace must satisfy: finite values, no teleport/spike/flash, no screen vanishing while visible, no turning back without a finger, motion starts within 3 frames, settled state matches the routes. |
| `scenario.ts` | Scenarios as data (screens, options, steps) and `runScenario`, which plays them and checks every rule. Assertion steps: `expectRoutes`, `expectPath`, `expectSnap`, `expectTaps`, `expectScene`, `expectElementAtRest`, `expectOverlay`. |
| `catalog.ts` | The generated space: stack transitions (presets, edge slides, scale-fade × preset/timing/bouncy/instant specs × 10 interaction sequences); sheets (edges, snap sets, step behavior, snap lock × snapTo and gesture sequences); backdrop behaviors; nested gesture ownership (the e2e app's `GestureInfo` tables); gesture options (enablement, activation areas, direction sets, pinch, sensitivity, runtime `setOptions`); `inactiveBehavior`; `styleId` slots and style reset; custom content/backdrop/surface components; overlays; `stackProgress`; animating on initial mount. |
| `catalog-runner.ts` | Runs the catalog under the environment a test file installed; `catalog*.test.tsx` cover iOS 390×844 at 60 Hz (strict about known issues), Android 412×915, 120 Hz, and a compact 320×568 screen. |
| `known-issues.ts` | Library behavior found and not fixed yet. The catalog test fails on any violation none of them explains, and on one that stops reproducing. |

## Running

```sh
bun test packages/react-native-screen-transitions/src/__tests__/harness
# one scenario, frame by frame (see inspect.test.tsx for options):
SCENARIO="slide-horizontal / preset-spec / rapid" SCENE=B bun test inspect
# every violation as JSON:
HARNESS_REPORT=/tmp/report.json bun test catalog
```

## Adding coverage

- A new kind of transition or option: add it to `transitions` or `specs` in `catalog.ts`; it runs against every sequence.
- A new interaction: add a sequence to `sequences`.
- A new rule: add a check to `invariants.ts` and call it from `runScenario`.

## Approximations

- Screen-level layers are assumed to fill the window, so transforms apply about the window center.
- Touches go to every gesture above the touched screen; the first to activate wins unless composed with `Gesture.Simultaneous`. Other gesture relations are not modelled yet.
- Environments vary platform, window, insets and display rate, not RTL yet.
- Not covered yet: scroll handoff (`Transition.ScrollView`), bounds/zoom/reveal (needs simulated layout measurement), the native-stack adapter.
