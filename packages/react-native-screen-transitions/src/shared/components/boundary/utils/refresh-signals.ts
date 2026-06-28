import type {
	LinkPairsState,
	ScreenPairKey,
} from "../../../stores/bounds/types";
import type { MeasureTarget } from "../types";

const SOURCE_SIGNAL_PREFIX = "source|";
const DESTINATION_SIGNAL_PREFIX = "destination|";

type RefreshBoundarySignal = MeasureTarget & {
	signal: string;
};

const buildRefreshSignal = (
	type: MeasureTarget["type"],
	pairKey: ScreenPairKey,
	key: string,
): RefreshBoundarySignal => {
	"worklet";
	const prefix =
		type === "source" ? SOURCE_SIGNAL_PREFIX : DESTINATION_SIGNAL_PREFIX;
	return {
		type,
		pairKey,
		signal: `${prefix}${pairKey}|${key}`,
	};
};

const isMatchedScreenPortalDestinationRefresh = (
	linkState: LinkPairsState | undefined,
	pairKey: ScreenPairKey,
	linkId: string,
) => {
	"worklet";

	return (
		linkState?.[pairKey]?.links?.[linkId]?.source?.portalAttachTarget ===
		"matched-screen"
	);
};

export const getRefreshBoundarySignal = (params: {
	enabled: boolean;
	currentScreenKey: string;
	sourcePairKey?: ScreenPairKey;
	destinationPairKey?: ScreenPairKey;
	ancestorDestinationPairKey?: ScreenPairKey;
	nextScreenKey?: string;
	linkId: string;
	group?: string;
	shouldRefresh: boolean;
	closing: boolean;
	entering: boolean;
	animating: boolean;
	progress: number;
	linkState?: LinkPairsState;
}): RefreshBoundarySignal | null => {
	"worklet";
	const {
		enabled,
		currentScreenKey,
		sourcePairKey,
		destinationPairKey,
		ancestorDestinationPairKey,
		nextScreenKey,
		linkId,
		group,
		shouldRefresh,
		closing,
		entering,
		animating,
		progress,
		linkState,
	} = params;

	if (!enabled) return null;

	const canRefreshPreCloseDestination =
		shouldRefresh && closing && !entering && !animating && progress >= 1;

	const canRefreshSettledDestination = shouldRefresh && !closing && !entering;

	// Guards:
	// 1) A user may dismiss via back button, in this case, we should remeasure.
	// 2) If a user drags during entering/closing animations we should NOT remeasure.
	if (!canRefreshPreCloseDestination && !canRefreshSettledDestination) {
		return null;
	}

	// Non group:
	// Since in typical group flows we would need to know the src, we don't need to do that for
	// single a->b flows. So we just trigger the destination refresh.
	if (!group) {
		const refreshDestinationPairKey =
			destinationPairKey ??
			(nextScreenKey ? undefined : ancestorDestinationPairKey);

		if (!refreshDestinationPairKey) {
			return null;
		}

		// NOTE:
		// Matched-screen portals use the destination as the initial host/anchor.
		// Once attached, the teleported source is the thing being animated, so a
		// fresh destination measure would mix in a second coordinate basis. Signals were introduced for scroll view cases + group
		// cases, but I can't find a case for where a live component ( matched-screen ) would need this complexity. I would just assume
		// you would want this for a->b | b->a transitions.
		if (
			isMatchedScreenPortalDestinationRefresh(
				linkState,
				refreshDestinationPairKey,
				linkId,
			)
		) {
			return null;
		}

		return buildRefreshSignal(
			"destination",
			refreshDestinationPairKey,
			[currentScreenKey, closing ? "closing" : "settled"].join("|"),
		);
	}

	// Source side:
	// When the activeId changes, trigger a refresh to ensure the source bounds are captured.
	if (sourcePairKey) {
		const activeId = linkState?.[sourcePairKey]?.groups?.[group]?.activeId;

		if (activeId !== linkId) {
			return null;
		}

		return buildRefreshSignal(
			"source",
			sourcePairKey,
			[group, linkId, closing ? "closing" : "settled"].join("|"),
		);
	}

	const refreshDestinationPairKey =
		destinationPairKey ??
		(nextScreenKey ? undefined : ancestorDestinationPairKey);

	if (!refreshDestinationPairKey) return null;

	// Destination side:
	// When the activeId changes, trigger a refresh to ensure the destination bounds are captured.
	const activeId =
		linkState?.[refreshDestinationPairKey]?.groups?.[group]?.activeId;

	// Destination retargeting should only measure a concrete member that already
	// participates in the pair. Missing members fall back to initialId at resolve.
	if (activeId !== linkId) {
		return null;
	}

	// NOTE:
	// see above for explanation
	if (
		isMatchedScreenPortalDestinationRefresh(
			linkState,
			refreshDestinationPairKey,
			linkId,
		)
	) {
		return null;
	}

	return buildRefreshSignal(
		"destination",
		refreshDestinationPairKey,
		[group, linkId, closing ? "closing" : "settled"].join("|"),
	);
};
