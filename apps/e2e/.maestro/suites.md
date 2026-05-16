# Maestro Testing Suite

Maestro should answer one question: does the package work on a real device when a user navigates, taps, swipes, scrolls, snaps, uses backdrops, sees shared transitions, and goes back?

Assumptions:
- E2E examples live under dedicated `maestro/*` routes.
- The app home/demo UI is not part of this suite.
- Each scenario starts from a known route-local state.
- Each pushed screen exposes a visible test action for dismiss/back.
- Dismiss assertions return to the scenario's expected previous screen, not root unless that scenario explicitly starts there.
- Every scenario runs on iOS and Android where the behavior is supported.

## Navigation And Dismissal

- [ ] A user can open the basic navigation scenario route.
- [ ] Tapping push from A shows B.
- [ ] B is visible and interactive after push.
- [ ] Tapping B dismiss/back returns to A.
- [ ] A remains visible and interactive after B dismisses.
- [ ] A pushes B, then B pushes C.
- [ ] C dismiss/back returns to B.
- [ ] B dismiss/back returns to A.
- [ ] A can push a short multi-screen chain.
- [ ] Each screen in the chain dismisses back exactly one level.
- [ ] Repeated push/dismiss interactions do not leave the app stuck.

## Pointer Events During Transitions

- [ ] While B is opening over A, A cannot receive taps.
- [ ] After B is dismissed, B cannot still receive taps.

## Swipe Dismiss Gestures

- [ ] Horizontal dismiss works.
- [ ] Horizontal-inverted dismiss works.
- [ ] Vertical dismiss works.
- [ ] Vertical-inverted dismiss works.
- [ ] Wrong-axis swipe does not dismiss.
- [ ] Short swipe leaves the screen open.
- [ ] Gesture dismiss returns to the scenario's previous screen.

## Pinch Gestures

- [ ] Pinch-in dismiss works, using a driver that supports reliable pinch input.
- [ ] Pinch-out dismiss works, using a driver that supports reliable pinch input.

## Gesture Enablement

- [ ] Disabled gesture does not dismiss.
- [ ] Visible dismiss action still works when gestures are disabled.
- [ ] Edge gesture works from the configured edge.
- [ ] Edge gesture does not trigger from the center.

## Snap Points

- [ ] Sheet opens at its configured initial snap point.
- [ ] Swipe collapses to a lower snap point.
- [ ] Swipe expands to a higher snap point.
- [ ] Weak swipe leaves the sheet at its current snap point.
- [ ] Lowest snap dismisses when dismiss is enabled.
- [ ] Wrong-axis drag does not move the sheet.
- [ ] Sheet dismiss returns to the scenario's previous screen.

## Sheet Directions

- [ ] Bottom-origin sheet opens, collapses, expands, and dismisses correctly.
- [ ] One horizontal-origin sheet opens, collapses, expands, and dismisses correctly.

## Auto Snap

- [ ] Auto snap opens to the measured content height.
- [ ] Auto snap expands to full height.
- [ ] Auto snap collapses back to measured content height.
- [ ] Auto snap updates after visible content size changes.

## Programmatic Snap Actions

- [ ] Tapping `snapTo` first moves the sheet to the first snap point.
- [ ] Tapping `snapTo` next moves the sheet to the next snap point.
- [ ] Tapping `snapTo` full moves the sheet to the full snap point.
- [ ] Repeated programmatic snap actions leave the visible snap state correct.

## Snap Lock

- [ ] With snap lock enabled, user swipes do not move to another snap point.
- [ ] With snap lock enabled, programmatic snap still moves the sheet.
- [ ] Turning snap lock off allows the next user swipe to snap.

## Multi-Axis Snap

- [ ] A multi-axis snap scenario visibly resolves to the expected configured snap outcome.

## Scroll Handoff

- [ ] Scroll content scrolls normally while not at its boundary.
- [ ] Pulling at the content boundary activates the screen or sheet gesture.
- [ ] Momentum scroll does not accidentally dismiss the screen.
- [ ] Cancelling a dismiss keeps the scroll view usable.
- [ ] Horizontal boundary handoff gives the gesture to the screen/sheet when expected.
- [ ] `expand-and-collapse` expands and collapses from the scroll boundary.
- [ ] `collapse-only` collapses from the scroll boundary and does not expand from scroll content.

## Gesture Ownership

- [ ] A horizontal child inside a vertical parent can scroll horizontally without dismissing the parent.
- [ ] A vertical child inside a vertical parent handles its own visible gesture behavior when configured to do so.
- [ ] The nearest nested gesture owner wins in a three-level scenario.
- [ ] After a nested owner unmounts, the parent gesture works again.
- [ ] A snap sheet does not let its gesture leak to an ancestor when it should own the gesture.

## Backdrop Behavior

- [ ] `dismiss`: tapping the backdrop dismisses the active screen.
- [ ] `dismiss`: tapping the backdrop does not also trigger the underlying button.
- [ ] `collapse`: tapping the backdrop collapses the sheet from a high snap and dismisses from the lowest snap.
- [ ] `block`: tapping the backdrop leaves the active screen open and does not trigger the underlying button.
- [ ] `passthrough`: tapping the backdrop triggers the underlying button and leaves the active screen open unless that button navigates.
- [ ] Custom backdrop is visibly rendered and follows its configured tap behavior.

## Overlay Behavior

- [ ] Overlay is visibly present when configured.
- [ ] Overlay visibility remains correct across push and dismiss.
- [ ] Overlay does not block content touches unless intended.

## Bounds And Shared Transitions

- [ ] Tapping a source item opens a destination screen with the matching item visible.
- [ ] The open transition visibly connects the tapped source item to the destination item.
- [ ] Dismissing the destination visibly returns to the same source item.
- [ ] Opening item A and then item B does not reuse item A's visible transition target.
- [ ] Repeating open/dismiss for the same item continues to animate from the correct item.
- [ ] A layout/content change before navigation still transitions from the currently visible item.
- [ ] Same visual tag in separate transition scopes does not animate to the wrong screen.
- [ ] Closing a shared transition returns to the scenario's previous screen and leaves it usable.
