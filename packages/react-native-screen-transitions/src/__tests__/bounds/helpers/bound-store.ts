import {
	clearScreenBounds,
	getActiveGroupId,
	getDestination,
	getEntry,
	getLink,
	getSource,
	type MeasuredEntry,
	removeEntry,
	resolveTransitionPair,
	setActiveGroupId,
	setDestination,
	setEntry,
	setSource,
} from "../../../stores/bounds";

export type Snapshot = MeasuredEntry;

/** The bounds store grouped for tests. */
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
		byScreen: clearScreenBounds,
	},
};
