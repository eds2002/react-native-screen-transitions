import { clear, clearByAncestor } from "./internals/clear";
import {
	getBoundaryConfig,
	getBoundaryPresence,
	getGroupActiveId,
	getGroups,
	hasBoundaryPresence,
	registerBoundaryPresence,
	setGroupActiveId,
	unregisterBoundaryPresence,
} from "./internals/presence";
import {
	getActiveLink,
	getLatestPendingSourceScreenKey,
	getSnapshot,
	hasDestinationLink,
	hasPendingLink,
	hasPendingLinkFromSource,
	hasSourceLink,
	registerSnapshot,
	setLinkDestination,
	setLinkSource,
	updateLinkDestination,
	updateLinkSource,
} from "./internals/registry";
import { resolveTransitionPair } from "./internals/resolver";

export type {
	BoundaryConfig,
	ResolvedTransitionPair,
	ResolveTransitionContext,
	Snapshot,
} from "./types";

export const BoundStore = {
	registerSnapshot,
	setLinkSource,
	setLinkDestination,
	updateLinkSource,
	updateLinkDestination,
	getActiveLink,
	registerBoundaryPresence,
	unregisterBoundaryPresence,
	hasBoundaryPresence,
	getBoundaryPresence,
	getBoundaryConfig,
	hasPendingLink,
	hasPendingLinkFromSource,
	getLatestPendingSourceScreenKey,
	hasSourceLink,
	hasDestinationLink,
	getSnapshot,
	resolveTransitionPair,
	setGroupActiveId,
	getGroupActiveId,
	clear,
	clearByAncestor,
	getGroups,
};
