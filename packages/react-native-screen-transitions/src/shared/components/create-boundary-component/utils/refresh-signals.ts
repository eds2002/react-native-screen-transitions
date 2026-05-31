import {
	createPendingPairKey,
	createScreenPairKey,
	getDestinationScreenKeyFromPairKey,
} from "../../../stores/bounds/helpers/link-pairs.helpers";
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

const findNestedDestinationPairKey = (
	linkState: LinkPairsState | undefined,
	linkId: string,
	ancestorScreenKeys: readonly string[] | undefined,
): ScreenPairKey | null => {
	"worklet";
	const destinationScreenKey = ancestorScreenKeys?.[0];
	if (!linkState || !destinationScreenKey) return null;

	for (const pairKey in linkState) {
		if (getDestinationScreenKeyFromPairKey(pairKey) !== destinationScreenKey) {
			continue;
		}

		if (linkState[pairKey]?.links?.[linkId]?.destination) {
			return pairKey;
		}
	}

	return null;
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
	preferredSourceScreenKey?: string;
	nextScreenKey?: string;
	linkId: string;
	group?: string;
	ancestorScreenKeys?: readonly string[];
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
		preferredSourceScreenKey,
		nextScreenKey,
		linkId,
		group,
		ancestorScreenKeys,
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

	if (!canRefreshPreCloseDestination && !canRefreshSettledDestination) {
		return null;
	}

	// Non-group refresh only rewrites destination bounds. Source refresh is a
	// grouped-only fallback for active ids that do not have source bounds yet.
	if (!group) {
		if (nextScreenKey) {
			return null;
		}

		// Nested initial screens have no previous screen in their own navigator,
		// so recover the pair by looking for a destination on the ancestor route.
		const pairKey = preferredSourceScreenKey
			? createScreenPairKey(preferredSourceScreenKey, currentScreenKey)
			: findNestedDestinationPairKey(linkState, linkId, ancestorScreenKeys);

		if (!pairKey) return null;

		return buildRefreshSignal(
			"destination",
			pairKey,
			[currentScreenKey, closing ? "closing" : "settled"].join("|"),
		);
	}

	// Source-side grouped refresh: a new active id may not have source bounds yet,
	// so the next screen's lifecycle pulse gives that source one chance to capture.
	if (nextScreenKey) {
		const pairKey = createScreenPairKey(currentScreenKey, nextScreenKey);
		const pendingPairKey = createPendingPairKey(currentScreenKey);
		const activeId = linkState?.[pairKey]?.groups?.[group]?.activeId;
		const hasSource =
			!!linkState?.[pairKey]?.links?.[linkId]?.source ||
			!!linkState?.[pendingPairKey]?.links?.[linkId]?.source;

		if (activeId !== linkId || hasSource) {
			return null;
		}

		return buildRefreshSignal(
			"source",
			pairKey,
			[group, linkId, closing ? "closing" : "settled"].join("|"),
		);
	}

	if (!preferredSourceScreenKey) return null;

	// Destination-side grouped refresh: only the active member rewrites the
	// destination side, keeping inactive grouped members from stealing the link.
	const pairKey = createScreenPairKey(
		preferredSourceScreenKey,
		currentScreenKey,
	);
	const activeId = linkState?.[pairKey]?.groups?.[group]?.activeId;
	const hasSource = !!linkState?.[pairKey]?.links?.[linkId]?.source;
	const hasDestination = !!linkState?.[pairKey]?.links?.[linkId]?.destination;

	// Destination retargeting should only measure a concrete member that already
	// participates in the pair. Missing members fall back to initialId at resolve.
	if (activeId !== linkId || (!hasSource && !hasDestination)) {
		return null;
	}

	return buildRefreshSignal(
		"destination",
		pairKey,
		[group, linkId, closing ? "closing" : "settled"].join("|"),
	);
};
