import type { RegistryState } from "../internals/state";
import type { TagID, TagState } from "../types";
import { hasAnyKeys } from "./keys";

export const ensureTagState = (state: RegistryState, tag: TagID): TagState => {
	"worklet";
	if (!state[tag]) {
		state[tag] = {
			screens: {},
			linkStack: [],
		};
	}
	return state[tag];
};

export const pruneTagState = (state: RegistryState, tag: TagID) => {
	"worklet";
	const tagState = state[tag];
	if (!tagState) return;

	if (!hasAnyKeys(tagState.screens) && tagState.linkStack.length === 0) {
		delete state[tag];
	}
};
