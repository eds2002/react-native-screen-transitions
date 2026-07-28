import { hasAnyKeys } from "../helpers/keys";
import type { Entry, EntryPatch, ScreenKey, TagID } from "../types";
import { type BoundaryEntriesState, boundaryRegistry } from "./state";

const ensureBoundaryState = (state: BoundaryEntriesState, tag: TagID) => {
	"worklet";
	if (!state[tag]) {
		state[tag] = {
			screens: {},
		};
	}
	return state[tag];
};

const ensureScreenEntry = (
	state: BoundaryEntriesState,
	tag: TagID,
	screenKey: ScreenKey,
): Entry => {
	"worklet";
	const tagState = ensureBoundaryState(state, tag);
	if (!tagState.screens[screenKey]) {
		tagState.screens[screenKey] = {
			bounds: null,
			styles: {},
		};
	}
	return tagState.screens[screenKey];
};

const applyEntryPatch = (entry: Entry, patch: EntryPatch) => {
	"worklet";
	if (patch.bounds !== undefined) {
		entry.bounds = patch.bounds;
	}

	if (patch.styles !== undefined) {
		entry.styles = patch.styles ?? {};
	}

	if (patch.boundaryConfig === null) {
		delete entry.boundaryConfig;
	} else if (patch.boundaryConfig !== undefined) {
		entry.boundaryConfig = patch.boundaryConfig;
	}

	if (patch.handoff === null) {
		delete entry.handoff;
	} else if (patch.handoff !== undefined) {
		entry.handoff = patch.handoff;
	}

	if (patch.escapeClipping === null) {
		delete entry.escapeClipping;
	} else if (patch.escapeClipping !== undefined) {
		entry.escapeClipping = patch.escapeClipping;
	}
};

function getEntry(tag: TagID, key: ScreenKey): Entry | null {
	"worklet";
	return boundaryRegistry.get()[tag]?.screens[key] ?? null;
}

function getMatchingSourceScreenKey(
	tag: TagID,
	destinationScreenKey: ScreenKey,
	preferredScreenKey?: ScreenKey,
): ScreenKey | null {
	"worklet";
	const screens = boundaryRegistry.get()[tag]?.screens;
	if (!screens) return null;
	if (
		preferredScreenKey &&
		preferredScreenKey !== destinationScreenKey &&
		screens[preferredScreenKey]
	) {
		return preferredScreenKey;
	}

	let latestScreenKey: ScreenKey | null = null;
	for (const screenKey in screens) {
		if (screenKey !== destinationScreenKey) {
			latestScreenKey = screenKey;
		}
	}

	return latestScreenKey;
}

function setEntry(tag: TagID, screenKey: ScreenKey, patch: EntryPatch) {
	"worklet";
	boundaryRegistry.modify(<T extends BoundaryEntriesState>(state: T): T => {
		"worklet";
		const entry = ensureScreenEntry(state, tag, screenKey);
		applyEntryPatch(entry, patch);
		return state;
	});
}

function removeEntry(tag: TagID, screenKey: ScreenKey) {
	"worklet";
	boundaryRegistry.modify(<T extends BoundaryEntriesState>(state: T): T => {
		"worklet";
		const tagState = state[tag];
		if (!tagState?.screens[screenKey]) {
			return state;
		}

		delete tagState.screens[screenKey];
		if (!hasAnyKeys(tagState.screens)) {
			delete state[tag];
		}

		return state;
	});
}

export { getEntry, getMatchingSourceScreenKey, removeEntry, setEntry };
