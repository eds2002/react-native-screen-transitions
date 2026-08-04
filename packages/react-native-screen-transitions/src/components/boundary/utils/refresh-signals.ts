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

export const getRefreshBoundarySignal = (params: {
	enabled: boolean;
	currentScreenKey: string;
	sourcePairKey?: ScreenPairKey;
	destinationPairKey?: ScreenPairKey;
	linkId: string;
	group?: string;
	shouldRefresh: boolean;
	settled?: boolean;
	closing: boolean;
	linkState?: LinkPairsState;
}): RefreshBoundarySignal | null => {
	"worklet";
	const {
		enabled,
		currentScreenKey,
		sourcePairKey,
		destinationPairKey,
		linkId,
		group,
		shouldRefresh,
		settled = false,
		closing,
		linkState,
	} = params;

	if (!enabled) return null;

	if (!shouldRefresh && (!group || !settled)) {
		return null;
	}

	// A source may move while its destination is active, so refresh whichever
	// side of the pair this boundary currently represents.
	if (!group) {
		if (sourcePairKey) {
			const sourcePair = linkState?.[sourcePairKey];
			const participates =
				!!sourcePair?.links?.[linkId] || !!sourcePair?.sourceRequests?.[linkId];

			if (!participates) {
				return null;
			}

			return buildRefreshSignal(
				"source",
				sourcePairKey,
				[currentScreenKey, closing ? "closing" : "settled"].join("|"),
			);
		}

		const refreshDestinationPairKey = destinationPairKey;

		if (!refreshDestinationPairKey) {
			return null;
		}

		if (!linkState?.[refreshDestinationPairKey]?.links?.[linkId]) {
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
		const pair = linkState?.[sourcePairKey];
		const groupState = pair?.groups?.[group];
		const activeId = groupState?.activeId;

		if (activeId !== linkId) {
			return null;
		}

		// The opening member is captured by the initial handshake. A settled
		// refresh is only needed after selection moves to another member.
		if (
			!shouldRefresh &&
			(groupState?.initialId === undefined ||
				activeId === groupState.initialId ||
				!!pair?.links?.[linkId]?.source)
		) {
			return null;
		}

		return buildRefreshSignal(
			"source",
			sourcePairKey,
			[
				group,
				linkId,
				shouldRefresh ? (closing ? "closing" : "settled") : "retarget",
			].join("|"),
		);
	}

	const refreshDestinationPairKey = destinationPairKey;

	if (!refreshDestinationPairKey) return null;

	// Destination side:
	// When the activeId changes, trigger a refresh to ensure the destination bounds are captured.
	const pair = linkState?.[refreshDestinationPairKey];
	const groupState = pair?.groups?.[group];
	const activeId = groupState?.activeId;

	// Destination retargeting should only measure a concrete member that already
	// participates in the pair. Missing members fall back to initialId at resolve.
	if (activeId !== linkId) {
		return null;
	}

	if (
		!shouldRefresh &&
		(groupState?.initialId === undefined ||
			activeId === groupState.initialId ||
			!!pair?.links?.[linkId]?.destination)
	) {
		return null;
	}

	return buildRefreshSignal(
		"destination",
		refreshDestinationPairKey,
		[
			group,
			linkId,
			shouldRefresh ? (closing ? "closing" : "settled") : "retarget",
		].join("|"),
	);
};
