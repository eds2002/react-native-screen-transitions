import { memo, useLayoutEffect, useMemo } from "react";
import {
	makeMutable,
	type SharedValue,
	useDerivedValue,
	useSharedValue,
} from "react-native-reanimated";
import { NO_PROPS, NO_STYLES } from "../../../constants";
import { useBuilderStore } from "../../../providers/builder";
import {
	screenTopology,
	useScreenRelationships,
} from "../../../providers/builder/topology";
import { useOptionalScreenHostStore } from "../../../providers/host/screen-host.provider";
import {
	useOptionalOrchestratorStore,
	useOrchestratorStore,
} from "../../../providers/orchestrator";
import { usePairDestinationKeys } from "../../../providers/orchestrator/helpers/use-pair-presentation";
import {
	areResettableStatesBySlotEqual,
	type ResettableStyleStatesBySlot,
	resolveSlotStyles,
} from "../../../providers/orchestrator/styles/helpers/resolve-slot-styles";
import {
	boundaryRegistry,
	pairs,
} from "../../../stores/bounds/internals/state";
import type { NormalizedTransitionInterpolatedStyle } from "../../../types/animation.types";
import {
	type BoundaryPresentationState,
	resolveBoundaryHandoff,
	resolveBoundaryPresentation,
} from "../helpers/presentation";

export type BoundaryPresentationValue = {
	owner: ReturnType<typeof resolveBoundaryPresentation> | null;
	/** Where a handoff boundary's content goes; null outside any transition. */
	receiver: ReturnType<typeof resolveBoundaryHandoff> | null;
	slots: NormalizedTransitionInterpolatedStyle;
};

export type BoundaryPresentationHandles = {
	presentation: SharedValue<BoundaryPresentationValue>;
	slotsMap: SharedValue<NormalizedTransitionInterpolatedStyle>;
	/** Set by the overlay once this boundary's host is placed (it only gets one once engaged). */
	portalHostReady: SharedValue<boolean>;
};

// A boundary at rest has no overlay host: every one of them shares this (never set).
const NO_PORTAL_HOST = makeMutable(false);

/**
 * A boundary outside any transition follows no pair: it reads its screen's slots, through values
 * the screen owns, so it runs no UI work of its own (a long list of boundaries costs that much less
 * to mount). It switches to `useBoundaryPresentation` once it takes part in a transition.
 */
export function useIdleBoundaryPresentation(): BoundaryPresentationHandles {
	const presentation = useOrchestratorStore((s) => s.idleBoundaryPresentation);
	const slotsMap = useOrchestratorStore((s) => s.slotsMap);
	return useMemo(
		() => ({ presentation, slotsMap, portalHostReady: NO_PORTAL_HOST }),
		[presentation, slotsMap],
	);
}

// Screens are discovered through existing providers. React only wires subscriptions;
// their live UI values decide ownership, including retained closing screens.
export function useBoundaryPresentation(
	boundaryId: string,
): BoundaryPresentationHandles {
	const screenKey = useBuilderStore((s) => s.derivations.currentScreenKey);
	const scenes = useOptionalScreenHostStore((s) => s?.scenes);
	const own = useMemo(
		() => scenes?.map((s) => s.route.key) ?? [screenKey],
		[scenes, screenKey],
	);
	// Destinations in other stacks (a pair can cross stacks); none, and no render, within one stack.
	const otherDestinations = usePairDestinationKeys(own);
	const keys = useMemo(
		() => (otherDestinations.length ? [...own, ...otherDestinations] : own),
		[own, otherDestinations],
	);
	const pairPresentations = useOptionalOrchestratorStore(
		keys,
		(s) => s.pairPresentation,
	);
	const localSlots = useOrchestratorStore((s) => s.slotsMap);
	const frame = useOrchestratorStore((s) => s.screenInterpolatorProps);
	const { parentScreenKey } = useScreenRelationships();
	const ancestorSlots = useOptionalOrchestratorStore(
		parentScreenKey,
		(s) => s.slotsMap,
	);
	// The screens this one is nested in, nearest first. A card in a nested stack is covered by the
	// next route of whichever ancestor has one (its own stack may have none).
	const ancestorKeys = useMemo(() => {
		const out: string[] = [];
		let key: string | null | undefined = parentScreenKey;
		while (key && !out.includes(key)) {
			out.push(key);
			key = screenTopology.getRelationships(key).parentScreenKey;
		}
		return out;
	}, [parentScreenKey]);
	const ancestorFrames = useOptionalOrchestratorStore(
		ancestorKeys,
		(s) => s.screenInterpolatorProps,
	);
	const previous = useSharedValue<ResettableStyleStatesBySlot>(NO_PROPS);

	const presentation = useDerivedValue<BoundaryPresentationValue>(() => {
		function followedRoute(): string | undefined {
			const own = frame.get().next?.route.key;
			if (own) return own;
			for (const ancestor of ancestorFrames) {
				const next = ancestor?.get().next?.route.key;
				if (next) return next;
			}
			return undefined;
		}
		const state: BoundaryPresentationState = {
			presentations: pairPresentations,
			pairs: pairs.get(),
			entries: boundaryRegistry.get(),
			following: followedRoute(),
		};
		const owner = resolveBoundaryPresentation(screenKey, boundaryId, state);
		const receiver = resolveBoundaryHandoff(screenKey, boundaryId, state);
		const ownedSlot = owner?.ready
			? (owner.sourceKey === screenKey ? owner.source : owner.destination)[
					boundaryId
				]
			: undefined;

		const fallback = localSlots.get()[boundaryId];
		const { resolvedStylesMap, nextPreviousStyleStatesBySlot } =
			resolveSlotStyles({
				localStylesMaps: [{ [boundaryId]: ownedSlot ?? fallback ?? {} }],
				ancestorStylesMap: ownedSlot
					? (ancestorSlots?.get() ?? NO_STYLES)
					: NO_STYLES,
				previousStyleStatesBySlot: previous.get(),
			});
		if (
			!areResettableStatesBySlotEqual(
				previous.get(),
				nextPreviousStyleStatesBySlot,
			)
		) {
			previous.set(nextPreviousStyleStatesBySlot);
		}
		return { owner, receiver, slots: resolvedStylesMap };
	});
	const slotsMap = useDerivedValue(() => presentation.get().slots);
	const portalHostReady = useSharedValue(false);
	return useMemo(
		() => ({ presentation, slotsMap, portalHostReady }),
		[presentation, slotsMap, portalHostReady],
	);
}

/**
 * Runs `useBoundaryPresentation` for a boundary taking part in a transition and hands its values to
 * the boundary root (in a layout effect, so the root renders with them before the frame). Mounted
 * only while the boundary is engaged.
 */
export const BoundaryPresentationDriver = memo(
	function BoundaryPresentationDriver({
		boundaryId,
		onChange,
	}: {
		boundaryId: string;
		onChange: (handles: BoundaryPresentationHandles | null) => void;
	}) {
		const handles = useBoundaryPresentation(boundaryId);
		useLayoutEffect(() => {
			onChange(handles);
			return () => onChange(null);
		}, [handles, onChange]);
		return null;
	},
);
