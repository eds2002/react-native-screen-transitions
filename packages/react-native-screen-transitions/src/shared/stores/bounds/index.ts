import { clear, clearByAncestor, clearByBranch } from "./internals/clear";
import { getGroupActiveId, setGroupActiveId } from "./internals/groups";
import {
	getActiveLink,
	getEntry,
	getEntryConfig,
	getMeasuredEntry,
	getPendingLink,
	hasDestinationLink,
	hasSourceLink,
	removeEntry,
	setDestination,
	setEntry,
	setSource,
} from "./internals/registry";
import { resolveTransitionPair } from "./internals/resolver";

export type {
	BoundaryConfig,
	Entry,
	EntryPatch,
	MeasuredEntry,
	ResolvedTransitionPair,
	ResolveTransitionContext,
} from "./types";

export const BoundStore = {
	entry: {
		set: setEntry,
		get: getEntry,
		getMeasured: getMeasuredEntry,
		getConfig: getEntryConfig,
		remove: removeEntry,
	},
	link: {
		setSource,
		setDestination,
		getActive: getActiveLink,
		getPair: resolveTransitionPair,
		getPending: getPendingLink,
		hasSource: hasSourceLink,
		hasDestination: hasDestinationLink,
	},
	group: {
		setActiveId: setGroupActiveId,
		getActiveId: getGroupActiveId,
	},
	cleanup: {
		byScreen: clear,
		byAncestor: clearByAncestor,
		byBranch: clearByBranch,
	},
};
