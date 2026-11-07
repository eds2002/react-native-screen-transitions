/**
 * The bounds store: every boundary's measured entry per screen, the links between the screens of a
 * pair, and each mounted screen's transform and scroll. The only way in from outside this folder.
 */
export {
	createBoundTag,
	createGroupTag,
	createScreenPairKey,
	getDestinationScreenKeyFromPairKey,
	getLinkKeyFromTag,
	getSourceScreenKeyFromPairKey,
	isActiveGroupMember,
} from "./helpers/link-pairs.helpers";
export { clear as clearScreenBounds } from "./internals/clear";
export {
	applyEntryOps,
	type EntryOp,
	getEntry,
	getMatchingSourceScreenKey,
	removeEntry,
	setEntry,
} from "./internals/entries";
export {
	getActiveGroupId,
	getDestination,
	getLink,
	getMeasuredSourcePairKey,
	getPairKeyForDestination,
	getPairKeyForSource,
	getResolvedLink,
	getSource,
	requestSourceMeasure,
	setActiveGroupId,
	setDestination,
	setSource,
} from "./internals/links";
export {
	resolveScreenPairKey,
	resolveTransitionPair,
} from "./internals/resolver";
export {
	getScreenScroll,
	getScreenTransform,
	registerScreenScroll,
	registerScreenTransform,
	unregisterScreenScroll,
	unregisterScreenTransform,
} from "./internals/screens";
export { boundaryRegistry, pairs } from "./internals/state";
export type * from "./types";
