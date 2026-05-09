import {
	applyEntryPatch,
	ensureScreenEntry,
	findMatchingScreenEntry,
} from "../helpers/entries.helpers";
import { ensureTagState, pruneTagState } from "../helpers/tag-state.helpers";
import type { EntryPatch, ScreenEntry, ScreenKey, TagID } from "../types";
import { type RegistryState, registry } from "./state";

function getEntry(tag: TagID, key: ScreenKey): ScreenEntry | null {
	"worklet";
	return findMatchingScreenEntry(registry.get()[tag], key);
}

function setEntry(tag: TagID, screenKey: ScreenKey, patch: EntryPatch) {
	"worklet";
	registry.modify(<T extends RegistryState>(state: T): T => {
		"worklet";
		const tagState = ensureTagState(state, tag);
		const entry = ensureScreenEntry(tagState, screenKey);
		applyEntryPatch(entry, patch);
		return state;
	});
}

function removeEntry(tag: TagID, screenKey: ScreenKey) {
	"worklet";
	registry.modify(<T extends RegistryState>(state: T): T => {
		"worklet";
		const tagState = state[tag];
		if (!tagState?.screens[screenKey]) {
			return state;
		}

		delete tagState.screens[screenKey];
		pruneTagState(state, tag);

		return state;
	});
}

export { getEntry, removeEntry, setEntry };
