import { hasAnyKeys } from "../helpers/keys";
import { isScreenPairKeyForScreen } from "../helpers/link-pairs.helpers";
import type { LinkPairsState, ScreenKey } from "../types";
import { type BoundaryEntriesState, boundaryRegistry, pairs } from "./state";

function clear(screenKey: ScreenKey) {
	"worklet";

	boundaryRegistry.modify(<T extends BoundaryEntriesState>(state: T): T => {
		"worklet";
		for (const tag in state) {
			const tagState = state[tag];
			delete tagState.screens[screenKey];

			if (!hasAnyKeys(tagState.screens)) {
				delete state[tag];
			}
		}

		return state;
	});

	pairs.modify(<T extends LinkPairsState>(state: T): T => {
		"worklet";
		for (const pairKey in state) {
			if (isScreenPairKeyForScreen(pairKey, screenKey)) {
				delete state[pairKey];
			}
		}

		return state;
	});
}

export { clear };
