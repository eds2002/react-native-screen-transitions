import { hasAnyKeys } from "../helpers/keys";
import type { EntryPatch, ScreenEntry, ScreenKey, TagID } from "../types";
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
): ScreenEntry => {
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

const applyEntryPatch = (entry: ScreenEntry, patch: EntryPatch) => {
	"worklet";
	if (patch.bounds !== undefined) {
		entry.bounds = patch.bounds;
	}

	if (patch.styles !== undefined) {
		entry.styles = patch.styles ?? {};
	}

	if (patch.boundaryConfig === undefined) {
		return;
	}

	if (patch.boundaryConfig === null) {
		delete entry.boundaryConfig;
	} else {
		entry.boundaryConfig = patch.boundaryConfig;
	}
};

function getEntry(tag: TagID, key: ScreenKey): ScreenEntry | null {
	"worklet";
	return boundaryRegistry.get()[tag]?.screens[key] ?? null;
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

export { getEntry, removeEntry, setEntry };
