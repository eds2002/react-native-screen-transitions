import { clear } from "./internals/clear";
import { getEntry, removeEntry, setEntry } from "./internals/entries";
import {
	getActiveGroupId,
	getDestination,
	getLink,
	getSource,
	setActiveGroupId,
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
		setActiveGroupId,
		getLink,
		getSource,
		getDestination,
		getActiveGroupId,
		getPair: resolveTransitionPair,
	},
	cleanup: {
		byScreen: clear,
	},
};
