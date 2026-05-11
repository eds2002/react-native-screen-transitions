import { clear } from "./internals/clear";
import { getEntry, removeEntry, setEntry } from "./internals/entries";
import {
	getGroupActiveId,
	getGroupInitialId,
	setGroupActiveId,
	setGroupInitialId,
} from "./internals/groups";
import {
	getMatchedLink,
	getPendingLink,
	hasDestinationLink,
	hasSourceLink,
	setDestination,
	setSource,
} from "./internals/links";
import { resolveTransitionPair } from "./internals/resolver";
import type { MeasuredEntry } from "./types";

export type {
	BoundaryConfig,
	Entry,
	EntryPatch,
	MeasuredEntry,
	ResolvedTransitionPair,
	ResolveTransitionContext,
} from "./types";

export type Snapshot = MeasuredEntry;

export const BoundStore = {
	entry: {
		set: setEntry,
		get: getEntry,
		remove: removeEntry,
	},
	link: {
		setSource,
		setDestination,
		getMatched: getMatchedLink,
		getPair: resolveTransitionPair,
		getPending: getPendingLink,
		hasSource: hasSourceLink,
		hasDestination: hasDestinationLink,
	},
	group: {
		setActiveId: setGroupActiveId,
		setInitialId: setGroupInitialId,
		getActiveId: getGroupActiveId,
		getInitialId: getGroupInitialId,
	},
	cleanup: {
		byScreen: clear,
	},
};
