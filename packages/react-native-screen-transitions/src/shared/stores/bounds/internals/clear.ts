import { hasAnyKeys } from "../helpers/keys";
import { matchesNavigatorKey, matchesScreenKey } from "../helpers/matching";
import type { NavigatorKey, ScreenEntry, ScreenKey, TagLink } from "../types";
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

function clearByAncestor(ancestorKey: ScreenKey) {
	"worklet";
	clearRegistry(
		(entryScreenKey, screenEntry) => {
			return (
				entryScreenKey === ancestorKey ||
				(screenEntry.ancestorKeys?.includes(ancestorKey) ?? false)
			);
		},
		(link) => {
			return (
				matchesScreenKey(link.source, ancestorKey) ||
				matchesScreenKey(link.destination, ancestorKey)
			);
		},
	);
}

function clearByBranch(branchNavigatorKey: NavigatorKey) {
	"worklet";
	if (!branchNavigatorKey) return;

	clearRegistry(
		(_entryScreenKey, screenEntry) => {
			return (
				screenEntry.navigatorKey === branchNavigatorKey ||
				(screenEntry.ancestorNavigatorKeys?.includes(branchNavigatorKey) ??
					false)
			);
		},
		(link) => {
			return (
				matchesNavigatorKey(link.source, branchNavigatorKey) ||
				matchesNavigatorKey(link.destination, branchNavigatorKey)
			);
		},
	);
}

export { clear, clearByAncestor, clearByBranch };
