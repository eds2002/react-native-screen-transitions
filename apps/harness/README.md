# Harness app

On-device labs for screen-transitions: one lab per library mechanism, each a
small screen family with one plain interpolator (interpolator math is not under
test), labelled buttons and testIDs for Argent loops. Each lab file starts with
what it covers and a numbered Argent loop script.

| Lab | Covers |
|---|---|
| `stack` | push, pop, swipe back, cancelled swipe, replace, rapid pushes, pop during push, push during pop |
| `sheet` | snap points, snapTo, gesture expand/collapse/dismiss, snap lock, step behavior, `"auto"` snap |
| `backdrop` | dismiss, collapse, block, passthrough |
| `gestures` | direction arrays, edge and px activation areas, pinch-in/out, runtime enable/direction |
| `ownership` | nested stacks: inheritance, different axis, shadowing, claim fallback, nested sheet |
| `scroll` | scroll handoff: dismiss at the top, expand-and-collapse vs collapse-only sheets |
| `inactive` | inactiveBehavior keep/pause/hide/unmount, rapid pushes |
| `slots` | styleId slots and style reset, content/surface/backdrop components |
| `overlay` | overlay persisting across pushes, focused route, overlayShown |
| `bounds` | zoom (swipe/pinch), zoom to a bound, styles() morph, reveal(), group retarget |
| `native-stack` | withScreenTransitions on native-stack: slide and zoom, mixed with plain native screens |
| `motion` | standalone units, no navigator: useMotion pager (snap points as pages), useMotion sheet (open/close/snapTo, drag and backdrop dismiss), Transition.Presence with an `"auto"` snap point |

Conventions: page `<lab>-<screen>`, buttons `<lab>-<action>`, probes `<lab>-<name>`
showing `name:value`. Deep link: `harness://lab/<id>`.

```sh
npx expo run:ios --device "<device name>" --configuration Release
```

## Debug bridge

`labs/bridge.tsx` keeps the harness state Argent asserts on: the open lab, the
focused route path, every screen's transition state (`Page` renders a
`ScreenReporter`), whether everything is settled, and JS errors
(`ErrorUtils` and `console.error`).

- **Release and debug**: a hidden 1×1 view with `testID="harness-state"`
  whose accessibility label is the summary as JSON (refreshed at most every 100 ms):

  ```json
  {"lab":"gestures","path":"card","settled":false,
   "screens":[{"n":"home","p":1,"a":0,"c":0},{"n":"card","p":0.2,"a":1,"c":1}],
   "errors":0,"frames":0}
  ```

  `n` route name, `p` progress (rounded to 0.1 while level 1), `a` animating, `c` closing.
  `e2e/state.sh <udid>` prints it.
- **Debug builds** (`debugger-evaluate`): `globalThis.__harness` with `state()`,
  `summary()`, `setLevel(n)` (0 off for perf runs, 1 state changes, 2 also every
  frame's progress), `startRecording()` / `stopRecording()` (per-frame progress
  samples) and `reset()`.

## E2E

`e2e/` drives this app with Argent and checks every run visually (blanks,
flickers, jumps) from a recording; see `e2e/README.md`.
