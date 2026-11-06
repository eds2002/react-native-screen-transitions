import { useAnimatedReaction, useSharedValue } from "react-native-reanimated";
import { useBuilderStore } from "../../../providers/builder";
import { useOptionalMotionStore } from "../../../providers/motion";
import {
	getMeasuredSourcePairKey,
	getPairKeyForDestination,
	getPairKeyForSource,
} from "../../../stores/bounds/internals/links";
import { pairs } from "../../../stores/bounds/internals/state";
import {
	type BoundaryMeasureData,
	measureBoundaryWith,
	useScreenMeasureContext,
} from "../hooks/use-measurer";
import type { MeasureTarget } from "../types";
import { getRefreshBoundarySignal } from "../utils/refresh-signals";
import { getInitialSourceCaptureSignal } from "../utils/source-signals";
import { boundaryMeasureRegistry } from "./measure-registry";

type MeasureSignal = {
	/** Registration id plus kind: a remounted boundary starts with no history. */
	key: string;
	signal: string;
	data: BoundaryMeasureData;
	target: MeasureTarget;
};

/**
 * Asks this screen's boundaries to measure, from one reaction per screen:
 * - source capture: a pair from this screen requested this boundary's source bounds;
 * - refresh: the transition this boundary takes part in is about to run (or settled with a new
 *   group member), so its bounds are measured again.
 * The signals are the same pure functions the per-boundary reactions used; a boundary measures
 * when its signal changes, as before.
 */
export function useBoundaryMeasureCoordinator(enabled: boolean) {
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
	const screen = useScreenMeasureContext(currentScreenKey);

	useAnimatedReaction(
		() => {
			"worklet";
			const boundaries = enabled
				? boundaryMeasureRegistry.get()[currentScreenKey]
				: undefined;
			const linkState = pairs.get();
			if (!boundaries) return null;

			const canRefresh =
				hasConfiguredInterpolator && !!willAnimate && !!progressSettled;
			const isClosing = !!closing?.get();
			const closeStarted = canRefresh && isClosing && !lastClosing.get();
			const shouldRefresh =
				(canRefresh && !!willAnimate?.get()) || closeStarted;
			const settled = canRefresh && !!progressSettled?.get();

			const signals: MeasureSignal[] = [];
			for (const tag in boundaries) {
				const { id, linkKey, group, data } = boundaries[tag];
				const sourcePairKey =
					getPairKeyForSource(tag, currentScreenKey) ?? undefined;

				const source = getInitialSourceCaptureSignal({
					enabled: true,
					sourcePairKey,
					linkId: linkKey,
					group,
					linkState: sourcePairKey ? linkState : undefined,
				});
				if (source) {
					signals.push({
						key: `${id}|source`,
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
					enabled: true,
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
			for (const { key, signal, data, target } of signals ?? []) {
				next[key] = signal;
				if (previous[key] !== signal) measureBoundaryWith(screen, data, target);
			}
			lastSignals.set(next);
			lastClosing.set(!!closing?.get());
		},
	);
}
