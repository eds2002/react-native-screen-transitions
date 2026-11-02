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

Conventions: page `<lab>-<screen>`, buttons `<lab>-<action>`, probes `<lab>-<name>`
showing `name:value`. Deep link: `harness://lab/<id>`.

```sh
npx expo run:ios --device "<device name>" --configuration Release
```
