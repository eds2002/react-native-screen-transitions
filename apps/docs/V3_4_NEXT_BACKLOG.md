# v3.4 Next Docs Backlog

This backlog is the writing plan for documenting the current branch against `main`.

- Stable baseline: `main` / `3.3.0`
- Next lane: current branch / `3.4.0-alpha.1`
- Goal: turn the `v3.3 -> v3.4-next` delta into release notes, migration notes, and concept guides that match the actual code, tests, and demo app

## Delta Summary

The dominant `3.4` story is not one isolated feature. It is a broader transition architecture shift across:

- bounds and navigation zoom
- mask-aware transitions
- slot-based interpolator output
- surface/custom rendering layers
- intrinsic auto snap points
- ancestor-scoped animation and gesture hooks
- a feature-first example app instead of stack-first demo trees

Docs should reflect that this is a meaningful next-line release, not a small incremental patch over `3.3`.

## Comparison Matrix

| Area | `3.3` stable | `3.4-next` | Primary evidence |
| --- | --- | --- | --- |
| Bounds/shared transitions | Smaller set of feature islands | Full bounds hub with zoom, sync, gallery, spam, example, gesture, active, style-id scenarios | `apps/e2e/app/[stackType]/bounds/*` |
| Navigation zoom | More limited/older demo shape | First-class bounds navigation zoom path with mask/container style ids and options | `src/shared/types/bounds.types.ts`, `bounds-navigation-zoom.test.ts` |
| Interpolator format | Flat keys still dominant in docs examples | Slot model is canonical: `content`, `backdrop`, `surface`, custom ids, animated `props` | `src/shared/types/animation.types.ts`, `normalize-interpolated-style.test.ts` |
| Custom layers | Background-style mental model | `surfaceComponent` plus `surface` slot becomes the story | `src/shared/types/screen.types.ts` |
| Sheet detents | Numeric snap points | `snapPoints` supports `"auto"` and interpolators get `layouts.content` | `src/shared/types/screen.types.ts`, `src/shared/animation/snap-to.ts`, `bottom-sheet/auto-snap.tsx` |
| Hook targeting | Local screen emphasis | `useScreenGesture` and `useScreenAnimation` can target ancestors | `screen-gesture-target.test.ts`, `screen-animation-target.test.ts` |
| Demo IA | Separate blank/native route trees | Unified feature-first `/<stackType>/...` route model | `apps/e2e/app/[stackType]/_layout.tsx`, `stack-routing.ts` |
| Performance story | Mostly implicit | Explicit benchmark harness for package vs JS stack | `apps/e2e/app/stack-benchmark/*` |

## Priority 0: Must Write Now

### 1. Release Notes: `3.4-next`

Create or expand the `Next` release-notes page to summarize the branch in product language.

Required sections:

- Bounds and navigation zoom as the headline feature
- Auto snap points and richer sheet behavior
- Slot-based interpolator model and custom layers
- Ancestor-scoped hook targeting
- Stability and performance work

Must mention:

- `Boundary` and `createBoundaryComponent`
- `BoundsNavigationAccessor.zoom()`
- `navigationMaskEnabled`
- `"auto"` snap points
- `surfaceComponent`

Source of truth:

- `packages/react-native-screen-transitions/src/shared/index.ts`
- `packages/react-native-screen-transitions/src/shared/types/bounds.types.ts`
- `packages/react-native-screen-transitions/src/shared/types/screen.types.ts`
- `packages/react-native-screen-transitions/CHANGELOG.md`
- `apps/e2e/app/[stackType]/bounds/index.tsx`

Acceptance criteria:

- Reads as a coherent release story, not a changelog dump
- Links to the concept pages below
- Explains why `3.4` matters to an existing `3.3` user

### 2. Migration Guide: `3.3 -> 3.4-next`

Create a dedicated migration page for users already on `3.3`.

Required migration callouts:

- `maskEnabled -> navigationMaskEnabled`
- `expandViaScrollView -> sheetScrollGestureBehavior`
- legacy flat interpolator keys -> slot-based shape
- `overlayStyle` now normalizes into `backdrop`
- background-style customization -> `surfaceComponent` + `surface`
- old example route names and old blank/native demo paths are no longer the docs mental model

Behavior notes to call out explicitly:

- new option names win if both old and new aliases are present
- `navigationMaskEnabled` defaults to `false`
- `"auto"` snap points depend on measured content, and `layouts.content` may be undefined until measurement exists

Source of truth:

- `packages/react-native-screen-transitions/src/shared/__tests__/screen-transition-options.test.ts`
- `packages/react-native-screen-transitions/src/shared/types/animation.types.ts`
- `packages/react-native-screen-transitions/src/shared/__tests__/normalize-interpolated-style.test.ts`
- `packages/react-native-screen-transitions/src/shared/types/screen.types.ts`

Acceptance criteria:

- A `3.3` user can scan the page and know what to rename, what to keep temporarily, and what conceptual model changed

### 3. Concept Guide: Bounds and Navigation Zoom

This should be the largest new concept guide.

Required sections:

- What bounds are
- `sharedBoundTag` vs `styleId`
- `Boundary` and grouping/isolation
- id-only matching vs grouped matching
- navigation zoom mental model
- mask/container choreography
- when to enable navigation masking
- advanced scenarios: sync, gallery, spam, nested example flow

Demo routes to map directly into the guide:

- `/<stackType>/bounds/active`
- `/<stackType>/bounds/gesture`
- `/<stackType>/bounds/style-id`
- `/<stackType>/bounds/zoom`
- `/<stackType>/bounds/zoom-id`
- `/<stackType>/bounds/gallery`
- `/<stackType>/bounds/example`
- `/<stackType>/bounds/sync`
- `/<stackType>/bounds/spam`

Source of truth:

- `apps/e2e/app/[stackType]/bounds/index.tsx`
- `packages/react-native-screen-transitions/src/shared/types/bounds.types.ts`
- `packages/react-native-screen-transitions/src/shared/__tests__/bounds-navigation-zoom.test.ts`

Acceptance criteria:

- A user can choose between active, gesture, style-id, zoom, and sync patterns without reading source first

### 4. Concept Guide: Auto Snap Sheets

This page should explain sheet behavior as a real system, not a few props.

Required sections:

- numeric snap points vs `"auto"`
- `initialSnapIndex`
- `snapTo()`
- `snapVelocityImpact`
- `gestureSnapLocked`
- `sheetScrollGestureBehavior`
- how nested scrollables hand off gesture control
- what `layouts.content` means for custom interpolators

Primary example routes:

- `/<stackType>/bottom-sheet/auto-snap`
- `/<stackType>/bottom-sheet/multi-snap`
- `/<stackType>/bottom-sheet/snap-index-animation`
- `/<stackType>/bottom-sheet/snap-lock-*`
- `/gestures/scroll-apple-maps`
- `/gestures/scroll-instagram`

Source of truth:

- `packages/react-native-screen-transitions/src/shared/types/screen.types.ts`
- `packages/react-native-screen-transitions/src/shared/animation/snap-to.ts`
- `apps/e2e/app/[stackType]/bottom-sheet/auto-snap.tsx`

Acceptance criteria:

- Users understand intrinsic detents, scroll handoff, and when to reach for programmatic snapping

### 5. Concept Guide: Transition Slots and Custom Layers

This should replace any lingering flat-style docs mental model.

Required sections:

- canonical slot shape
- shorthand vs explicit `{ style, props }`
- `content`, `backdrop`, `surface`
- custom ids via `styleId`
- animated props for things like `BlurView`
- `backdropComponent`
- `surfaceComponent`
- backward compatibility for legacy flat keys

Primary examples:

- `/<stackType>/custom-backdrop`
- `/<stackType>/custom-background`

Source of truth:

- `packages/react-native-screen-transitions/src/shared/types/animation.types.ts`
- `packages/react-native-screen-transitions/src/shared/__tests__/normalize-interpolated-style.test.ts`
- `packages/react-native-screen-transitions/src/shared/__tests__/types/public-api.typecheck.ts`

Acceptance criteria:

- New docs examples stop using legacy flat return shapes as the default

### 6. Concept Guide: Ancestor-Scoped Hooks

This should explain the new targeting behavior for nested flows.

Required sections:

- default `self`
- `parent`
- `root`
- `{ ancestor: n }`
- difference between animation target fallback and gesture target fallback
- isolation boundaries for gesture targets

Source of truth:

- `packages/react-native-screen-transitions/src/shared/__tests__/screen-animation-target.test.ts`
- `packages/react-native-screen-transitions/src/shared/__tests__/screen-gesture-target.test.ts`

Acceptance criteria:

- Users can intentionally target parent or root transition state in nested stacks without guesswork

## Priority 1: Important Follow-Up Pages

### 7. Recipe: Feature-First Example Routing

Explain the new example topology so docs stop referencing old `blank-stack/*` and `native-stack/*` paths.

Must cover:

- `/<stackType>/...` route convention
- feature-first navigation through the demo app
- how to compare the same scenario across stack implementations

Source of truth:

- `apps/e2e/app/[stackType]/_layout.tsx`
- `apps/e2e/components/stack-examples/stack-routing.ts`
- `apps/e2e/app/index.tsx`

### 8. Performance Note: Benchmark Harness

This is not front-page docs. It belongs as a perf appendix or positioning note.

Must cover:

- what is being compared
- what `js-stack` means in this repo
- what the benchmark does and does not prove

Source of truth:

- `apps/e2e/app/stack-benchmark/index.tsx`
- `apps/e2e/app/stack-benchmark/[impl]/_layout.tsx`
- `apps/e2e/layouts/js-stack.tsx`

## API Reference Follow-Up Work

The generated API reference is useful, but `3.4-next` introduced several docs-critical surfaces that should get better doc comments before API reference becomes a launch-quality source on its own.

Highest-priority doc-comment targets:

- `BoundsNavigationZoomOptions`
- `BoundsNavigationAccessor`
- `ScreenTransitionConfig`
- `TransitionInterpolatedStyle`
- `TransitionSlotStyle`
- ancestor-targeted hook APIs

Known reference-generation caveats to address later:

- `@platform` tags currently warn in TypeDoc
- several referenced helper types are not yet surfaced cleanly in generated docs

## Structured Crawl Order For Writing

When writing each page, crawl the repo in this order:

1. Public export entrypoint
   - `packages/react-native-screen-transitions/src/shared/index.ts`
   - stack entrypoints under `src/*/index.ts`
2. Canonical types
   - `src/shared/types/screen.types.ts`
   - `src/shared/types/animation.types.ts`
   - `src/shared/types/bounds.types.ts`
3. Behavioral tests
   - alias and migration behavior
   - slot normalization
   - ancestor-target resolution
   - bounds navigation zoom
4. Example proof routes
   - bounds hub
   - bottom-sheet auto snap
   - custom backdrop/surface
   - gestures hub
5. Changelog and commits
   - use to cluster themes, not to write raw prose

This order keeps docs anchored to public contract first, then proof of behavior, then examples.

## Suggested Writing Sequence

Write in this order:

1. `3.4-next` release notes
2. `3.3 -> 3.4-next` migration guide
3. bounds and navigation zoom
4. auto snap sheets
5. transition slots and custom layers
6. ancestor-scoped hooks
7. feature-first example routing note
8. benchmark appendix

That sequence lets release notes and migration notes ship first, then fills in the conceptual pages they should link to.

## Done Definition

The `v3.4-next` docs pass is done when:

- release notes summarize the architectural delta cleanly
- migration notes cover every required rename/deprecation/mental-model shift
- bounds, auto snap, slots/layers, and ancestor hooks each have dedicated concept pages
- example links use the new `/<stackType>/...` topology
- docs screenshots and route references stop pointing at removed `blank-stack/*` or `native-stack/*` paths
- API reference is linked from guides but not relied on as the only explanation for new surfaces
