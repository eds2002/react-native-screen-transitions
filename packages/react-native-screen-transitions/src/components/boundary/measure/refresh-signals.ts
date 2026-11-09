import type { LinkPairsState, ScreenPairKey } from "../../../stores/bounds";
import { isActiveGroupMember } from "../../../stores/bounds";
import type { MeasureTarget } from "../types";

type RefreshBoundarySignal = MeasureTarget & {
	signal: string;
};

/**
 * Whether a boundary may need measuring again at all: asked to refresh, or a group member while
 * the transition is settled (its selection can move). Cheap, so callers check it before looking up
 * the pairs getRefreshBoundarySignal needs.
 */
export const mayRefreshBoundary = (
	shouldRefresh: boolean,
	group: string | undefined,
	settled: boolean,
) => {
	"worklet";
	return shouldRefresh || (!!group && settled);
};

/**
 * Whether a boundary should be measured again, and for which side of which pair: a source may move
 * while its destination is active, so whichever side of the pair this boundary represents (the
 * source when it is both). A group's active member also refreshes when the selection moves to it
 * while the transition is settled (retarget); the opening member is captured by the initial
 * handshake.
 */
export const getRefreshBoundarySignal = (params: {
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

	if (!mayRefreshBoundary(shouldRefresh, group, settled)) return null;

	const type: MeasureTarget["type"] = sourcePairKey ? "source" : "destination";
	const pairKey = sourcePairKey ?? destinationPairKey;
	if (!pairKey) return null;
	const pair = linkState?.[pairKey];
	const phase = closing ? "closing" : "settled";
	const signal = (key: string): RefreshBoundarySignal => {
		"worklet";
		return { type, pairKey, signal: `${type}|${pairKey}|${key}` };
	};

	if (!group) {
		const participates =
			!!pair?.links?.[linkId] ||
			(type === "source" && !!pair?.sourceRequests?.[linkId]);
		return participates ? signal(`${currentScreenKey}|${phase}`) : null;
	}

	// Only a concrete member that is active (missing members fall back to initialId at resolve).
	if (!isActiveGroupMember(linkState, pairKey, group, linkId)) return null;
	const groupState = pair?.groups?.[group];
	if (
		!shouldRefresh &&
		(groupState?.initialId === undefined ||
			groupState.activeId === groupState.initialId ||
			!!pair?.links?.[linkId]?.[type])
	) {
		return null;
	}
	return signal(`${group}|${linkId}|${shouldRefresh ? phase : "retarget"}`);
};
