import type { View } from "react-native";
import {
	type AnimatedRef,
	type SharedValue,
	type StyleProps,
	useAnimatedReaction,
	useSharedValue,
} from "react-native-reanimated";
import { useBuilderStore } from "../../../providers/builder";
import { useOptionalMotionStore } from "../../../providers/motion/motion.store";
import {
	getMeasuredSourcePairKey,
	getPairKeyForDestination,
	getPairKeyForSource,
	pairs,
} from "../../../stores/bounds";
import type { NormalizedTransitionInterpolatedStyle } from "../../../types/animation.types";
import { isTeleportAvailable } from "../../../utils/teleport";
import type { MeasureTarget } from "../types";
import { boundaryMeasureRegistry } from "./measure-registry";
import { getRefreshBoundarySignal } from "./refresh-signals";
import { getInitialSourceCaptureSignal } from "./source-signals";
import {
	type BoundaryMeasureData,
	measureBoundaryWith,
	useScreenMeasureContext,
} from "./use-measurer";

/** A slot style that moves its view (a bounds transform), not just places it. */
const isMovedByStyle = (style: StyleProps | undefined) => {
	"worklet";
	const transform = style?.transform;
	if (!Array.isArray(transform)) return false;
	for (const item of transform as Record<string, unknown>[]) {
		for (const key in item) {
			const value = item[key];
			if (key.startsWith("scale") ? value !== 1 : value !== 0) return true;
		}
	}
	return false;
};

type MeasureSignal = {
	/** Registration id plus kind: a remounted boundary starts with no history. */
	key: string;
	tag: string;
	signal: string;
	data: BoundaryMeasureData;
	target: MeasureTarget;
};

/**
 * Asks this screen's boundaries to measure, from one reaction per screen:
 * - source capture: a pair from this screen requested this boundary's source bounds;
 * - refresh: the transition this boundary takes part in is about to run (or settled with a new
 *   group member), so its bounds are measured again.
 * A boundary measures when its signal changes.
 */
export function useBoundaryMeasureCoordinator(
	contentRef: AnimatedRef<View> | null,
	/** This screen's resolved styles: whether a boundary is being moved by its bounds style now. */
	slotsMap: SharedValue<NormalizedTransitionInterpolatedStyle>,
) {
	const currentScreenKey = useBuilderStore(
		(s) => s.derivations.currentScreenKey,
	);
	const nextScreenKey = useBuilderStore((s) => s.derivations.nextScreenKey);
	const hasConfiguredInterpolator = useBuilderStore(
		(s) => s.derivations.hasConfiguredInterpolator,
	);
	// Source-side boundaries refresh from the next screen's lifecycle pulse.
	// Destination-side boundaries have no next screen, so they refresh from self.
	const refreshScreenKey = nextScreenKey ?? currentScreenKey;
	const willAnimate = useOptionalMotionStore(
		refreshScreenKey,
		(store) => store.state.willAnimate,
	);
	const progressSettled = useOptionalMotionStore(
		refreshScreenKey,
		(store) => store.state.progressSettled,
	);
	const closing = useOptionalMotionStore(
		refreshScreenKey,
		(store) => store.state.closing,
	);
	const lastSignals = useSharedValue<Record<string, string>>({});
	// Whether the next screen was closing at the last run: a close starting refreshes like a
	// willAnimate pulse. A close can start without one (a drag released while the screen still moves:
	// a fast swipe back through a chain), and its source must be measured where it is now.
	const lastClosing = useSharedValue(false);
	// The screen side of measuring, once for all of this screen's boundaries.
	const screen = useScreenMeasureContext(currentScreenKey, contentRef);

	useAnimatedReaction(
		() => {
			"worklet";
			const boundaries = boundaryMeasureRegistry.get()[currentScreenKey];
			const linkState = pairs.get();
			if (!boundaries) return null;

			const canRefresh =
				hasConfiguredInterpolator && !!willAnimate && !!progressSettled;
			const isClosing = !!closing?.get();
			const closeStarted = canRefresh && isClosing && !lastClosing.get();
			const willAnimatePulse = canRefresh && !!willAnimate?.get();
			const settled = canRefresh && !!progressSettled?.get();

			const signals: MeasureSignal[] = [];
			for (const tag in boundaries) {
				const { id, linkKey, group, data } = boundaries[tag];
				const shouldRefresh = willAnimatePulse || closeStarted;
				const sourcePairKey =
					getPairKeyForSource(tag, currentScreenKey) ?? undefined;

				const source = getInitialSourceCaptureSignal({
					sourcePairKey,
					linkId: linkKey,
					group,
					linkState: sourcePairKey ? linkState : undefined,
				});
				if (source) {
					signals.push({
						key: `${id}|source`,
						tag,
						signal: source.signal,
						data,
						target: { type: "source", pairKey: source.pairKey },
					});
				}

				// A group's active member can change while the transition is settled (paging a
				// destination gallery): it refreshes without a willAnimate pulse.
				if (!canRefresh || !closing || (!shouldRefresh && (!group || !settled)))
					continue;
				const refresh = getRefreshBoundarySignal({
					currentScreenKey,
					// A source without a destination boundary (a zoom to the screen) refreshes too: its
					// close lands on it, and it may have moved since it was measured (or been measured while
					// its own screen was still opening).
					sourcePairKey:
						sourcePairKey ??
						getMeasuredSourcePairKey(tag, currentScreenKey) ??
						undefined,
					destinationPairKey:
						getPairKeyForDestination(tag, currentScreenKey) ?? undefined,
					linkId: linkKey,
					group,
					shouldRefresh,
					settled,
					closing: isClosing,
					linkState,
				});
				if (refresh) {
					signals.push({
						key: `${id}|refresh`,
						tag,
						signal: refresh.signal,
						data,
						target: { type: refresh.type, pairKey: refresh.pairKey },
					} as MeasureSignal);
				}
			}
			return signals;
		},
		(signals) => {
			"worklet";
			const previous = lastSignals.get();
			const next: Record<string, string> = {};
			const slots = slotsMap.get();
			for (const { key, tag, signal, data, target } of signals ?? []) {
				next[key] = signal;
				if (previous[key] === signal) continue;
				// Without a placeholder (it does not escape) a boundary's own root is measured: while
				// styles() moves it (a transition still running when another starts or closes), it would
				// be measured where it is drawn. Its last measurement stands in (styles() undo the screen
				// transform it was taken with). zoom()/reveal() compose window-space measurements: theirs
				// are always taken fresh.
				const slot = slots[tag];
				const moving =
					!isTeleportAvailable &&
					!!slot?.boundsPlaced &&
					isMovedByStyle(slot.style);
				measureBoundaryWith(screen, data, target, moving);
			}
			lastSignals.set(next);
			lastClosing.set(!!closing?.get());
		},
	);
}
