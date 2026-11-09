import { memo, useLayoutEffect, useMemo } from "react";
import {
	makeMutable,
	type SharedValue,
	useDerivedValue,
	useSharedValue,
} from "react-native-reanimated";
import { NO_STYLES } from "../../../constants";
import { useBuilderStore } from "../../../providers/builder";
import { useAncestorScreenKeys } from "../../../providers/builder/topology";
import { useStackScreenKeys } from "../../../providers/host/screen-host.provider";
import {
	useOptionalOrchestratorStore,
	useOrchestratorStore,
} from "../../../providers/orchestrator/orchestrator.store";
import { resolveSingleSlotStyle } from "../../../providers/orchestrator/styles/helpers/resolve-slot-styles";
import type { ResettableStyleState } from "../../../providers/orchestrator/styles/helpers/resolve-slot-styles/types";
import { boundaryRegistry, pairs } from "../../../stores/bounds";
import type { NormalizedTransitionInterpolatedStyle } from "../../../types/animation.types";
import {
	type BoundaryPresentationState,
	resolveBoundaryHandoffTarget,
	resolveBoundaryPresentation,
	resolveReceiverSize,
} from "./resolve-presentation";
import { usePairDestinationKeys } from "./use-pair-presentation";

export type BoundaryPresentationValue = {
	owner: ReturnType<typeof resolveBoundaryPresentation> | null;
	/** Where a handoff boundary's content goes; null outside any transition. */
	receiver: string | null;
	/**
	 * The receiver's size this frame while the content is in another screen's receiver. The content
	 * takes it in the same frame as the move: laid out through its portal, it would only learn the
	 * receiver's size a frame later (and a resizing receiver would leave it a frame behind).
	 */
	receiverSize?: { width: number; height: number } | null;
	slots: NormalizedTransitionInterpolatedStyle;
};

export type BoundaryPresentationHandles = {
	presentation: SharedValue<BoundaryPresentationValue>;
	slotsMap: SharedValue<NormalizedTransitionInterpolatedStyle>;
	/** Set by the overlay once this boundary's host is placed (it only gets one once engaged). */
	portalHostReady: SharedValue<boolean>;
};

const EMPTY_SLOT = {};

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
	const own = useStackScreenKeys(screenKey);
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
	// The same screens' frames: a payload handed on along a chain follows each screen's next route.
	const keyFrames = useOptionalOrchestratorStore(
		keys,
		(s) => s.screenInterpolatorProps,
	);
	const localSlots = useOrchestratorStore((s) => s.slotsMap);
	const frame = useOrchestratorStore((s) => s.screenInterpolatorProps);
	// The screens this one is nested in, nearest first. A card in a nested stack is covered by the
	// next route of whichever ancestor has one (its own stack may have none).
	const ancestorKeys = useAncestorScreenKeys(screenKey);
	const ancestorFrames = useOptionalOrchestratorStore(
		ancestorKeys,
		(s) => s.screenInterpolatorProps,
	);
	const previous = useSharedValue<ResettableStyleState | undefined>(undefined);

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
		function nextRouteOf(key: string): string | undefined {
			const index = keys.indexOf(key);
			return index < 0 ? undefined : keyFrames[index]?.get().next?.route.key;
		}
		const state: BoundaryPresentationState = {
			presentations: pairPresentations,
			pairs: pairs.get(),
			entries: boundaryRegistry.get(),
			following: followedRoute(),
			nextRouteOf,
		};
		const owner = resolveBoundaryPresentation(screenKey, boundaryId, state);
		const target = resolveBoundaryHandoffTarget(screenKey, boundaryId, state, {
			presentation: owner,
		});
		const receiver = target.receiver;
		let receiverSize: BoundaryPresentationValue["receiverSize"] = null;
		if (receiver !== screenKey) {
			receiverSize = resolveReceiverSize(
				target.slot?.style,
				state.entries[boundaryId]?.screens[receiver]?.bounds,
			);
		}
		const ownedSlot = owner?.ready
			? (owner.sourceKey === screenKey ? owner.source : owner.destination)[
					boundaryId
				]
			: undefined;

		// Everything that reads these slots reads this boundary's own (see resolveSingleSlotStyle).
		const fallback = localSlots.get()[boundaryId];
		const { resolvedSlot, nextState } = resolveSingleSlotStyle(
			boundaryId,
			ownedSlot ?? fallback ?? EMPTY_SLOT,
			previous.get(),
		);
		if (nextState !== previous.get()) {
			previous.set(nextState);
		}
		return {
			owner,
			receiver,
			receiverSize,
			slots: resolvedSlot ? { [boundaryId]: resolvedSlot } : NO_STYLES,
		};
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
