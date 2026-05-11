import { hasAnyKeys } from "../helpers/keys";
import { matchesScreenKey } from "../helpers/matching";
import type { ScreenEntry, ScreenKey, TagLink } from "../types";
import { type RegistryState, registry } from "./state";

type LinkPredicate = (link: TagLink) => boolean;

type ScreenPredicate = (
	screenKey: ScreenKey,
	screenEntry: ScreenEntry,
) => boolean;

const clearRegistry = (
	shouldClearScreen: ScreenPredicate,
	shouldClearLink: LinkPredicate,
) => {
	"worklet";
	registry.modify(<T extends RegistryState>(state: T): T => {
		"worklet";
		for (const tag in state) {
			const tagState = state[tag];

			for (const entryScreenKey in tagState.screens) {
				const screenEntry = tagState.screens[entryScreenKey];
				if (shouldClearScreen(entryScreenKey, screenEntry)) {
					delete tagState.screens[entryScreenKey];
				}
			}

			for (let i = tagState.linkStack.length - 1; i >= 0; i--) {
				const link = tagState.linkStack[i];
				if (shouldClearLink(link)) {
					tagState.linkStack.splice(i, 1);
				}
			}

			if (!hasAnyKeys(tagState.screens) && tagState.linkStack.length === 0) {
				delete state[tag];
			}
		}

		return state;
	});
};

function clear(screenKey: ScreenKey) {
	"worklet";
	clearRegistry(
		(entryScreenKey) => entryScreenKey === screenKey,
		(link) => {
			return (
				matchesScreenKey(link.source, screenKey) ||
				matchesScreenKey(link.destination, screenKey)
			);
		},
	);
}

export { clear };
