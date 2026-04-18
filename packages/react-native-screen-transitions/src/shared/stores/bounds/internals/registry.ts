import type { MeasuredDimensions, StyleProps } from "react-native-reanimated";
import { hasAnyKeys } from "../helpers/keys";
import { matchesScreenKey } from "../helpers/matching";
import type {
	BoundaryConfig,
	EntryPatch,
	MeasuredEntry,
	NavigatorKey,
	ScreenEntry,
	ScreenKey,
	TagID,
	TagLink,
	TagState,
} from "../types";
import { type RegistryState, registry } from "./state";

const LINK_HISTORY_LIMIT = 3;

type LinkSourceWriteMode = "capture" | "refresh";
type LinkDestinationWriteMode = "attach" | "refresh";

const ensureTagState = (state: RegistryState, tag: TagID): TagState => {
	"worklet";
	if (!state[tag]) {
		state[tag] = {
			screens: {},
			linkStack: [],
		};
	}
	return state[tag];
};

const ensureScreenEntry = (
	tagState: TagState,
	screenKey: ScreenKey,
): ScreenEntry => {
	"worklet";
	if (!tagState.screens[screenKey]) {
		tagState.screens[screenKey] = {
			bounds: null,
			styles: {},
		};
	}
	return tagState.screens[screenKey];
};

const hasMeasuredEntry = (
	entry: ScreenEntry | undefined,
): entry is MeasuredEntry => {
	"worklet";
	return entry?.bounds !== null && entry?.bounds !== undefined;
};

const pruneTagState = (state: RegistryState, tag: TagID) => {
	"worklet";
	const tagState = state[tag];
	if (!tagState) return;

	if (!hasAnyKeys(tagState.screens) && tagState.linkStack.length === 0) {
		delete state[tag];
	}
};

const applyEntryPatch = (entry: ScreenEntry, patch: EntryPatch) => {
	"worklet";
	if (patch.bounds !== undefined) {
		entry.bounds = patch.bounds;
	}

	if (patch.styles !== undefined) {
		entry.styles = patch.styles ?? {};
	}

	if (patch.boundaryConfig !== undefined) {
		if (patch.boundaryConfig === null) {
			delete entry.boundaryConfig;
		} else {
			entry.boundaryConfig = patch.boundaryConfig;
		}
	}

	if (patch.ancestorKeys !== undefined) {
		if (patch.ancestorKeys === null) {
			delete entry.ancestorKeys;
		} else {
			entry.ancestorKeys = patch.ancestorKeys;
		}
	}

	if (patch.navigatorKey !== undefined) {
		if (patch.navigatorKey === null) {
			delete entry.navigatorKey;
		} else {
			entry.navigatorKey = patch.navigatorKey;
		}
	}

	if (patch.ancestorNavigatorKeys !== undefined) {
		if (patch.ancestorNavigatorKeys === null) {
			delete entry.ancestorNavigatorKeys;
		} else {
			entry.ancestorNavigatorKeys = patch.ancestorNavigatorKeys;
		}
	}
};

const findMatchingScreenEntry = (
	tagState: TagState | undefined,
	screenKey: ScreenKey,
	shouldMatch: (entry: ScreenEntry) => boolean,
): ScreenEntry | null => {
	"worklet";
	if (!tagState) return null;

	const direct = tagState.screens[screenKey];
	if (direct && shouldMatch(direct)) {
		return direct;
	}

	for (const entryScreenKey in tagState.screens) {
		const entry = tagState.screens[entryScreenKey];
		if (!shouldMatch(entry)) continue;
		if (entry.ancestorKeys?.includes(screenKey)) {
			return entry;
		}
	}

	return null;
};

const isSameScreenFamily = (
	a: { screenKey: ScreenKey; ancestorKeys?: ScreenKey[] },
	b: { screenKey: ScreenKey; ancestorKeys?: ScreenKey[] },
): boolean => {
	"worklet";
	return (
		a.screenKey === b.screenKey ||
		(a.ancestorKeys?.includes(b.screenKey) ?? false) ||
		(b.ancestorKeys?.includes(a.screenKey) ?? false)
	);
};

function findLatestPendingIndex(
	stack: TagLink[],
	expectedSourceScreenKey?: ScreenKey,
): number {
	"worklet";
	for (let i = stack.length - 1; i >= 0; i--) {
		const link = stack[i];
		if (link.destination !== null) continue;
		if (
			expectedSourceScreenKey &&
			!matchesScreenKey(link.source, expectedSourceScreenKey)
		) {
			continue;
		}
		return i;
	}
	return -1;
}

function findLatestSourceIndex(
	stack: TagLink[],
	expectedSourceScreenKey?: ScreenKey,
): number {
	"worklet";
	if (!expectedSourceScreenKey) return -1;

	for (let i = stack.length - 1; i >= 0; i--) {
		if (matchesScreenKey(stack[i].source, expectedSourceScreenKey)) {
			return i;
		}
	}

	return -1;
}

function findLatestCompletedSourceIndex(
	stack: TagLink[],
	screenKey?: ScreenKey,
): number {
	"worklet";
	if (!screenKey) return -1;

	for (let i = stack.length - 1; i >= 0; i--) {
		const link = stack[i];
		if (link.destination && matchesScreenKey(link.source, screenKey)) {
			return i;
		}
	}

	return -1;
}

function findLatestCompletedDestinationIndex(
	stack: TagLink[],
	screenKey?: ScreenKey,
): number {
	"worklet";
	if (!screenKey) return -1;

	for (let i = stack.length - 1; i >= 0; i--) {
		const link = stack[i];
		if (link.destination && matchesScreenKey(link.destination, screenKey)) {
			return i;
		}
	}

	return -1;
}

function selectSourceUpdateTargetIndex(
	stack: TagLink[],
	screenKey: ScreenKey,
): number {
	"worklet";
	const completedIndex = findLatestCompletedSourceIndex(stack, screenKey);
	if (completedIndex !== -1) {
		return completedIndex;
	}

	return findLatestSourceIndex(stack, screenKey);
}

function selectDestinationWriteTargetIndex(
	stack: TagLink[],
	screenKey?: ScreenKey,
	expectedSourceScreenKey?: ScreenKey,
): number {
	"worklet";
	const completedIndex = findLatestCompletedDestinationIndex(stack, screenKey);
	if (completedIndex !== -1) {
		return completedIndex;
	}

	const pendingIndex = findLatestPendingIndex(stack, expectedSourceScreenKey);
	if (pendingIndex !== -1) {
		return pendingIndex;
	}

	return findLatestSourceIndex(stack, expectedSourceScreenKey);
}

function getEntry(tag: TagID, key: ScreenKey): ScreenEntry | null {
	"worklet";
	return findMatchingScreenEntry(registry.get()[tag], key, () => true);
}

function getMeasuredEntry(tag: TagID, key: ScreenKey): MeasuredEntry | null {
	"worklet";
	const entry = findMatchingScreenEntry(registry.get()[tag], key, (candidate) =>
		hasMeasuredEntry(candidate),
	);
	return (entry as MeasuredEntry | null) ?? null;
}

function getEntryConfig(
	tag: TagID,
	screenKey: ScreenKey,
): BoundaryConfig | null {
	"worklet";
	return getEntry(tag, screenKey)?.boundaryConfig ?? null;
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

function setSource(
	mode: LinkSourceWriteMode,
	tag: TagID,
	screenKey: ScreenKey,
	bounds: MeasuredDimensions,
	styles: StyleProps = {},
	ancestorKeys?: ScreenKey[],
	navigatorKey?: NavigatorKey,
	ancestorNavigatorKeys?: NavigatorKey[],
) {
	"worklet";
	registry.modify(<T extends RegistryState>(state: T): T => {
		"worklet";
		const source = {
			screenKey,
			ancestorKeys,
			navigatorKey,
			ancestorNavigatorKeys,
			bounds,
			styles,
		};

		if (mode === "capture") {
			const tagState = ensureTagState(state, tag);
			const stack = tagState.linkStack;
			const topIndex = stack.length - 1;
			const topLink = topIndex >= 0 ? stack[topIndex] : null;

			if (
				topLink &&
				topLink.destination === null &&
				isSameScreenFamily(topLink.source, source)
			) {
				topLink.source = source;
				return state;
			}

			stack.push({ source, destination: null });

			const overLimit = tagState.linkStack.length - LINK_HISTORY_LIMIT;
			if (overLimit > 0) {
				tagState.linkStack.splice(0, overLimit);
			}

			return state;
		}

		const stack = state[tag]?.linkStack;
		if (!stack || stack.length === 0) return state;
		const targetIndex = selectSourceUpdateTargetIndex(stack, screenKey);
		if (targetIndex === -1) return state;

		stack[targetIndex].source = source;

		return state;
	});
}

function setDestination(
	mode: LinkDestinationWriteMode,
	tag: TagID,
	screenKey: ScreenKey,
	bounds: MeasuredDimensions,
	styles: StyleProps = {},
	ancestorKeys?: ScreenKey[],
	expectedSourceScreenKey?: ScreenKey,
	navigatorKey?: NavigatorKey,
	ancestorNavigatorKeys?: NavigatorKey[],
) {
	"worklet";
	registry.modify(<T extends RegistryState>(state: T): T => {
		"worklet";
		const stack = state[tag]?.linkStack;
		if (!stack || stack.length === 0) return state;
		const targetIndex = selectDestinationWriteTargetIndex(
			stack,
			mode === "refresh" ? screenKey : undefined,
			expectedSourceScreenKey,
		);
		if (targetIndex === -1) return state;

		stack[targetIndex].destination = {
			screenKey,
			ancestorKeys,
			navigatorKey,
			ancestorNavigatorKeys,
			bounds,
			styles,
		};

		return state;
	});
}

function getActiveLink(tag: TagID, screenKey?: ScreenKey): TagLink | null {
	"worklet";
	const tagState = registry.get()[tag];
	const stack = tagState?.linkStack;
	if (!stack || stack.length === 0) {
		return null;
	}

	if (!screenKey) {
		const lastLink = stack[stack.length - 1];
		return lastLink ? lastLink : null;
	}

	for (let i = stack.length - 1; i >= 0; i--) {
		const link = stack[i];
		if (!link.destination) continue;
		if (
			matchesScreenKey(link.source, screenKey) ||
			matchesScreenKey(link.destination, screenKey)
		) {
			return link;
		}
	}

	return null;
}

function getPendingLink(
	tag: TagID,
	sourceScreenKey?: ScreenKey,
): TagLink | null {
	"worklet";
	const tagState = registry.get()[tag];
	const stack = tagState?.linkStack;
	if (!stack || stack.length === 0) return null;

	const targetIndex = findLatestPendingIndex(stack, sourceScreenKey);
	if (targetIndex === -1) return null;
	return stack[targetIndex] ?? null;
}

function hasSourceLink(tag: TagID, screenKey: ScreenKey): boolean {
	"worklet";
	const tagState = registry.get()[tag];
	const stack = tagState?.linkStack;
	if (!stack || stack.length === 0) return false;

	for (let i = stack.length - 1; i >= 0; i--) {
		if (matchesScreenKey(stack[i].source, screenKey)) return true;
	}

	return false;
}

function hasDestinationLink(tag: TagID, screenKey: ScreenKey): boolean {
	"worklet";
	const tagState = registry.get()[tag];
	const stack = tagState?.linkStack;
	if (!stack || stack.length === 0) return false;

	for (let i = stack.length - 1; i >= 0; i--) {
		if (matchesScreenKey(stack[i].destination, screenKey)) return true;
	}

	return false;
}

export {
	getActiveLink,
	getEntry,
	getEntryConfig,
	getMeasuredEntry,
	getPendingLink,
	hasDestinationLink,
	hasSourceLink,
	removeEntry,
	setDestination,
	setEntry,
	setSource,
};
