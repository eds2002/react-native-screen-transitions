import { hasAnyKeys } from "../helpers/keys";
import { matchesNavigatorKey, matchesScreenKey } from "../helpers/matching";
import type { NavigatorKey, ScreenKey } from "../types";
import { type RegistryState, registry } from "./state";

const clearByScreenKey = (
	screenKey: ScreenKey,
	includeDescendants: boolean,
) => {
	"worklet";

	registry.modify(<T extends RegistryState>(state: T): T => {
		"worklet";
		for (const tag in state) {
			const tagState = state[tag];

			for (const entryScreenKey in tagState.screens) {
				const screenEntry = tagState.screens[entryScreenKey];
				const shouldClearEntry =
					entryScreenKey === screenKey ||
					(includeDescendants &&
						(screenEntry.ancestorKeys?.includes(screenKey) ?? false));

				if (shouldClearEntry) {
					delete tagState.screens[entryScreenKey];
				}
			}

			for (let i = tagState.linkStack.length - 1; i >= 0; i--) {
				const link = tagState.linkStack[i];
				const shouldClearLink =
					matchesScreenKey(link.source, screenKey) ||
					matchesScreenKey(link.destination, screenKey);

				if (shouldClearLink) {
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

const clearByNavigator = (branchNavigatorKey: NavigatorKey) => {
	"worklet";

	registry.modify(<T extends RegistryState>(state: T): T => {
		"worklet";
		for (const tag in state) {
			const tagState = state[tag];

			for (const entryScreenKey in tagState.screens) {
				const screenEntry = tagState.screens[entryScreenKey];
				const shouldClearEntry =
					screenEntry.navigatorKey === branchNavigatorKey ||
					(screenEntry.ancestorNavigatorKeys?.includes(branchNavigatorKey) ??
						false);

				if (shouldClearEntry) {
					delete tagState.screens[entryScreenKey];
				}
			}

			for (let i = tagState.linkStack.length - 1; i >= 0; i--) {
				const link = tagState.linkStack[i];
				const shouldClearLink =
					matchesNavigatorKey(link.source, branchNavigatorKey) ||
					matchesNavigatorKey(link.destination, branchNavigatorKey);

				if (shouldClearLink) {
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
	clearByScreenKey(screenKey, false);
}

function clearByAncestor(ancestorKey: ScreenKey) {
	"worklet";
	clearByScreenKey(ancestorKey, true);
}

function clearByBranch(branchNavigatorKey: NavigatorKey) {
	"worklet";
	if (!branchNavigatorKey) return;

	clearByNavigator(branchNavigatorKey);
}

export { clear, clearByAncestor, clearByBranch };
