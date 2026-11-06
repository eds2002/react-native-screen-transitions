# Transition harness

Runs the real BlankStack frame by frame and checks what every screen looks like
on every frame, so one generated catalog covers what would otherwise take
hundreds of hand-written cases.

## Pieces

| File | What it does |
|---|---|
| `reanimated-sim.ts` | Frame-accurate Reanimated/Worklets stand-in: shared values step animation objects (the library spring, `withTiming`, `withDelay`) on a fake 60 Hz clock; reactions re-run each frame; `scheduleOnRN`, `scheduleOnUI` and `requestAnimationFrame` hop threads in order. |
| `install.ts` | Installs the sim and stand-ins for `react-native`, gesture-handler (keeps every handler so they can be fired), safe-area-context and teleport. Call it first in a harness test. `teleport: true` installs a react-native-teleport stand-in (absent by default, as in Expo Go): a portal's content is placed inside the host its `hostName` names that frame, as the native view is re-parented, for its rect, opacity, hit-testing and `measure()`. |
| `stack-harness.tsx` | Mounts the real `createBlankStackNavigator()` (screens can be nested stacks, or `independent` ones in their own NavigationContainer: paths, leaf routes and `goBack` read across both trees) and records per frame each screen's window rect (all ancestor transforms composed), opacity and touchability, its `styleId` elements and any overlays. Helpers: `push`, `pushIn` (nested), `navigate`, `goBack`, `replace`, `setOptions`, `tap` (React Native hit-testing, nearest `onPress`), `frame(s)`, `settle`. |
| `gesture-driver.ts` | Timed touches through the library's real pan/pinch handlers (manual activation, `onStart`/`onUpdate`/`onEnd`, simultaneous groups). Fingers ease in by default; `linear` is a constant-speed swipe (Maestro/Argent style). |
| `invariants.ts` | Rules every trace must satisfy: finite values, no teleport/spike/flash, no screen vanishing while visible, no turning back without a finger, motion starts within 3 frames, settled state matches the routes; a handoff payload (a bound's `payload: true` live child, recorded wherever it is teleported) is never hidden, not for a frame, and rests where the scenario says; a shared bound is one element (`bound-split`: every copy you can see, not transparent and not under an opaque screen, is drawn at the same rect while it transitions; `bound-vanish`: it does not blink out). zoom() and reveal() are exempt from the one-element rule: they morph the screen, and the bound keeps its own aspect. |
| `scenario.ts` | Scenarios as data (screens, options, steps) and `runScenario`, which plays them and checks every rule. Assertion steps: `expectRoutes`, `expectPath`, `expectSnap`, `expectTaps`, `expectScene`, `expectElementAtRest`, `expectOverlay`. |
| `catalog.ts` | One scenario family per library mechanism (including shared bounds inside scroll views: scrolled source lists, scrolled destinations, a list that moved while covered), one plain interpolator each (interpolator math is not under test): stack push/pop/swipe/interruptions with a slide in each axis (spring and instant); sheets (bottom, side, three snaps, step, snap lock); backdrop behaviors; nested gesture ownership (the e2e app's `GestureInfo` tables); gesture options; `inactiveBehavior`; `styleId` slots and style reset; custom layer components; overlays; `stackProgress`; initial mount; scroll handoff; bounds (zoom, `styles()`, `reveal()`); global bounds across the route tree (nested, sibling, deep and independent-container stacks); handoff (true shared elements, as designed: still screens, only the boundaries animate with `styles()` in transform and size, from a scrolled list, into a scrolled destination and across stacks, with spam; teleport run only); `styles()` and handoff on screens that move (`bounds-moving-*`: slide with parallax, slide and scale, slide up; hops, swipes, chains and spam along A -> B -> C). About 400 scenarios. |
| `catalog-runner.ts` | Runs the catalog under the environment a test file installed; `catalog*.test.tsx` cover iOS 390×844 at 60 Hz (strict about known issues), Android 412×915, 120 Hz, a compact 320×568 screen, and teleport installed (`catalog-teleport`: boundaries escape clipping into their overlay hosts). |
| `known-issues.ts` | Library behavior found and not fixed yet (optionally only in some runs, by label). The catalog test fails on any violation none of them explains, and on one that stops reproducing. |

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
- Scroll views move their content by their offset, for the recorder and for `measure()` alike; boundaries can sit inside scroll content (`scroll.bounds`), and a covered screen can be scrolled (`scrollTo` with `screen`).
- `measure()` reports a view as the last committed frame drew it: its layout, scroll position and every animated
  transform on it and its ancestors, as a device does (Reanimated commits animated props once per frame). Values
  changed since that frame (a close that just started) are not seen until the next one.
- Teleport is modelled at the recorder: a teleported view's box composes its host's ancestors. Paint order is not (an escaped view hit-tests in its portal's place in the tree, not on top).
- Not covered yet: virtualized lists, the native-stack adapter.

## Follow-ups

- `measure()` now includes animated transforms; fix what it found (`zoom-measured-mid-zoom`,
  `boundary-measures-own-motion-without-teleport` in `known-issues.ts`).
- A custom navigator on the kit (`catalog-custom-navigator`), unmounted while screens are open, changes how
  the next mount behaves (start latency, closes not landing, ghost screens in `bounds-chain middle-reopen`
  run right after a scenario that ends on C). Blank Stack does not. Scenarios end on their first screen
  until this is found.
