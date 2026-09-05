# Motion contract discussion

## Objective

Move Screen Transitions outside Blank Stack so Blank Stack consumes the transition system. Use this extraction as the immediate design problem; designing additional custom navigators is not the current task. Preserve the working motion behavior while clarifying ownership and composition.

## Agreed starting point — September 5, 2026

Collapse the options, gestures, and animation providers into one motion provider, using the existing `createProvider` utility. This replaces the three provider boundaries rather than adding another wrapper around them.

- Internal hooks can still organize the separate responsibilities and receive their dependencies directly.
- Expose one coherent, screen-keyed view of motion state. The existing screen-animation hook already provides a basis for that access.
- Preserve shared-value identity across renders. Options, screen relationships, and other inputs must remain able to update without resetting motion.
- Keep navigation decisions with the host.
- This grouping should make a future public provider easier to understand once the remaining contracts are settled.

## Agreed slot boundary

Move responsibility for transition readiness and visibility blocking out of the slot provider. These correspond to the current `interpolatorReady` and visibility-blocking logic.

Readiness should describe whether the screen is prepared to transition, including measurement blockers. Interpolator availability is a separate concern. Slots and interpolation may consume readiness and visibility signals without owning those decisions.

The proposed slot responsibility is named styles and props, shorthand normalization, style composition, and resets. The destination of the extracted responsibilities and the public composition API remain undecided.

## Agreed orchestration boundary

The combined motion provider should own the current screen's options, gesture state, and animation values. Combining providers does not mean moving the entire existing animation pipeline into that provider unchanged.

Introduce a dedicated orchestration layer for coordination between screens. The existing stack-specific assembly of previous/current/next animation state and the selection and handoff of interpolators during overlapping gestures/transitions belong to Blank Stack orchestration. Other hosts should be able to supply their own orchestration; its extension API is not yet decided.

Motion answers what the current screen's motion is. Blank Stack orchestration coordinates screens according to stack behavior; another host can coordinate them differently. Slots normalize, compose, and reset the resulting named styles and props. The host still supplies screen relationships and navigation decisions. Exact APIs and component boundaries remain open.

## Latest proposed public composition

Use three provider boundaries, with provisional names: Builder → Motion → Orchestrator → Content.

- Builder accepts the host's inputs and prepares screen identity, relationship keys, and configuration. The precise treatment of descriptors and topology remains to be designed.
- Motion owns only the current screen's options, gestures, and animation state.
- Orchestration includes coordination between screens, gesture-related coordination, interpolator selection/evaluation, and slot processing. Slot normalization, composition, and resets can remain separate internal hooks without requiring another public provider.
- Blank Stack supplies its orchestration rules; other hosts should be able to customize how screens and interpolators are coordinated.
- Screen content consumes the resulting styles and props. A consumer may use supplied content components or render their own views.

This supersedes the earlier diagram showing slots as a separate public layer. Readiness and visibility remain separate responsibilities from slot processing; their placement is still open. Peer screen keys are the proposed lookup mechanism, but the exact input contract and whether a descriptor provider remains necessary are not settled.

## Storage direction

The intended direction is for providers created with `createProvider` to own the actual shared values and expose those same values through keyed global lookup, replacing the separate system, animation, and gesture store maps. This is stronger than placing a new public facade over the existing global stores. The field allocation, lifetime handling, and migration mechanics remain to be worked out.

## Remaining decisions

- The provider's final name and exact public value shape.
- The orchestration layer's API and placement, including its relationship to the public screen-animation hook.
- How the existing store values move into provider ownership without duplicating state or resetting it on input updates.
- Where readiness and visibility belong after extraction, and the remaining boundaries for interpolation, topology, containers, and lifecycle cleanup.

## First implementation step

The descriptors provider has been renamed to Builder. Its existing props, descriptor payload, options, and derivations remain intact. Builder now owns the existing visibility wrapper and exposes `screenReady` and `visibilityBlocked` through its context and keyed store. Slots, boundary measurement, portals, and floating overlays read those signals from Builder.

This step preserves the existing readiness and visibility conditions, including the current interpolator-presence check. Readiness and visibility remain separate for now. Lifecycle behavior and the motion providers remain unchanged; the broader Motion and Orchestrator design above is still proposed.


## Builder-owned animation state

The former System Store values and actions now live in `useBuilderAnimationState`, created with `useSharedValue` and exposed as Builder's `animationState`. Reanimated owns shared-value animation cleanup. The separate System Store registry and its close-completion cleanup are removed. Animation Store and Gesture Store remain unchanged.

Global providers now offer an imperative getter for existing registered state, allowing transition blocking and snap actions to use the same Builder values as hooks. No state is allocated for a screen before its Builder mounts. Peer readers subscribe to mounted Builder state by key.

React Activity hiding preserves the hook's values; the existing provider registry disconnects during effect cleanup and reconnects on resume. A real unmount releases the registered state, and remounting creates fresh values.


## Topology provider folded into Builder

Builder now invokes `useScreenTopology` for the existing registration, active-child selection, and unregistration effects. It gets the parent screen key from the surrounding Builder and keeps the existing navigator and focus inputs. Composer no longer mounts a separate `ScreenTopologyProvider`.

The topology graph, subscriptions, relationship resolution, and gesture ownership coordinator are unchanged.

The topology module now lives under `providers/screen/builder/topology`, alongside Builder’s other implementation details.

## Motion and Orchestrator provider split

Composer now mounts Builder → ScreenLifecycle → Motion → Orchestrator → Slots → ScreenContainer. Motion replaces the separate options, gestures, and animation providers. Its internal hooks create the current screen's live options and gesture source, and its keyed state exposes the existing Animation Store shared values.

Orchestrator owns the previous/current/next animation pipeline, the bounds accessor, and cross-screen gesture ownership registration. The public `useScreenAnimation` hook reads the same interpolation frame and bounds through Orchestrator. Builder supplies the existing close-dependent unregister policy, keeping that Blank Stack subscription outside Motion.

This is a provider-boundary refactor. Animation Store and Gesture Store allocation, gesture release/navigation behavior, spring execution, and interpolation calculations retain their existing implementation. Slots remains a separate internal provider for this step. Moving raw store ownership and defining a host-independent orchestration API are still separate work.

## Current-screen pipeline belongs to Motion

Motion now calls `useMotionAnimationPipeline` to build its current screen's animation inputs: shared animation and gesture values, Builder-owned targets and measurement, route, metadata, transition options, and snap points. Orchestrator reads current Motion state locally and neighboring Motion states by key. It no longer constructs another screen's inputs or reads its Builder state.

Each Orchestrator reader still owns its mutable interpolation output, option override buffer, and layout buffer. They reference the same Motion shared values, while retaining independent output objects. Existing hydration calculations and per-interpolator override behavior are preserved.

## Slots folded into Orchestrator

Orchestrator now runs the existing interpolation and slot-resolution hooks and exposes `slotsMap` alongside its animation frame and bounds accessor. Interpolation receives the pipeline directly during construction. Parent slot inheritance reads the parent's keyed Orchestrator state. The styles module lives under `orchestrator/styles`.

The separate Screen Slot provider and registry are removed. Slot hooks and boundary readers consume Orchestrator, and overlays reuse one combined Orchestrator context. Overlay resource retention now tracks the combined owner and driver stores. Slots share Orchestrator's existing retained-state cleanup policy.

Composer now renders Builder → ScreenLifecycle → Motion → Orchestrator → ScreenContainer. Slot normalization, interpolation selection, style composition, and reset calculations are unchanged.

## Simplified slot inputs and cleanup

Removed the `unregisterOnCleanup` option from `createProvider` and the Builder/Orchestrator close-dependent retention override. Keyed providers now unregister on effect cleanup; a replacement Activity strategy remains future work.

`useResolvedStylesMap` resolves its ancestor through the keyed Orchestrator store internally. `useInterpolatedStylesMap` accepts only `pipeline`, reads visibility from Builder itself, and no longer accepts an `enabled` flag.

## Blank Stack supplies the screen contract

Builder now receives `descriptors`, optional `navigatorKey`, and optional `isActiveScreen` alongside its route key. Its descriptor structure and derivations remain unchanged. `isActiveScreen` defaults to true for hosts rendering a standalone screen.

Motion accepts `onDismissRequest`, passed to the existing pan and pinch release handlers. ScreenContainer accepts the same callback for backdrop dismissal. These callbacks run on the React thread, with gesture release calculations and animation execution unchanged. They report a dismissal request; their return value does not change the gesture release calculation.

The generic ScreenComposer contains Builder → Motion → Orchestrator → ScreenContainer. ScreenLifecycle is now composed by `BlankStackScreen`, which reads Blank Stack state and wires its existing navigation handler. StackView and the native-stack adapter both consume that wrapper.

Orchestrator uses optional Blank Stack and Stack Core reads. Without them, stack progress falls back to the local interpolation frame, closing-route gesture shadowing is inactive, and configured transitions are enabled by default. Normal React Native gesture, Reanimated, and safe-area setup is still provided by the host. Descriptor redesign and final public exports remain separate work.

## Topology remains a Blank Stack capability

Removed `navigatorKey` and `isActiveScreen` from Builder's inputs. `useScreenTopology` reads navigator identity and focused activity from optional Blank Stack context internally and only registers screens present in that stack. Custom hosts without Blank Stack state receive no topology registration; bounds integration is not part of their supported contract in this step.
