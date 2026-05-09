import { findLatestIndex } from "../helpers/find-latest";
import { hasAnyKeys } from "../helpers/keys";
import { matchesScreenKey } from "../helpers/matching";
import type {
	EntryPatch,
	ScreenEntry,
	ScreenKey,
	TagID,
	TagLink,
	TagState,
} from "../types";
import type { RegistryState } from "./state";

type EntryPatchOptionalField =
	| "boundaryConfig"
	| "ancestorKeys"
	| "navigatorKey"
	| "ancestorNavigatorKeys";
type LinkSide = "source" | "destination";

const ENTRY_PATCH_OPTIONAL_FIELDS = [
	"boundaryConfig",
	"ancestorKeys",
	"navigatorKey",
	"ancestorNavigatorKeys",
] as const satisfies readonly EntryPatchOptionalField[];

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

export const ensureScreenEntry = (
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

export const pruneTagState = (state: RegistryState, tag: TagID) => {
	"worklet";
	const tagState = state[tag];
	if (!tagState) return;

	if (!hasAnyKeys(tagState.screens) && tagState.linkStack.length === 0) {
		delete state[tag];
	}
};

export const applyEntryPatch = (entry: ScreenEntry, patch: EntryPatch) => {
	"worklet";
	if (patch.bounds !== undefined) {
		entry.bounds = patch.bounds;
	}

	if (patch.styles !== undefined) {
		entry.styles = patch.styles ?? {};
	}

	const target = entry as Record<EntryPatchOptionalField, unknown>;
	for (let i = 0; i < ENTRY_PATCH_OPTIONAL_FIELDS.length; i++) {
		const field = ENTRY_PATCH_OPTIONAL_FIELDS[i];
		const value = patch[field];
		if (value === undefined) continue;

		if (value === null) {
			delete target[field];
		} else {
			target[field] = value;
		}
	}
};

export const findMatchingScreenEntry = (
	tagState: TagState | undefined,
	screenKey: ScreenKey,
): ScreenEntry | null => {
	"worklet";
	if (!tagState) return null;

	const direct = tagState.screens[screenKey];
	if (direct) {
		return direct;
	}

	for (const entryScreenKey in tagState.screens) {
		const entry = tagState.screens[entryScreenKey];
		if (entry.ancestorKeys?.includes(screenKey)) {
			return entry;
		}
	}

	return null;
};

export const isSameScreenFamily = (
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

export function findLatestPendingSourceLinkIndex(
	stack: TagLink[],
	expectedSourceScreenKey?: ScreenKey,
): number {
	"worklet";
	return findLatestIndex(stack, (link) => {
		if (link.destination !== null) return false;
		return (
			!expectedSourceScreenKey ||
			matchesScreenKey(link.source, expectedSourceScreenKey)
		);
	});
}

function findLatestSourceIndex(
	stack: TagLink[],
	expectedSourceScreenKey?: ScreenKey,
): number {
	"worklet";
	if (!expectedSourceScreenKey) return -1;

	return findLatestIndex(stack, (link) =>
		matchesScreenKey(link.source, expectedSourceScreenKey),
	);
}

function findLatestCompletedSourceIndex(
	stack: TagLink[],
	screenKey?: ScreenKey,
): number {
	"worklet";
	if (!screenKey) return -1;

	return findLatestIndex(
		stack,
		(link) => !!link.destination && matchesScreenKey(link.source, screenKey),
	);
}

function findLatestCompletedDestinationIndex(
	stack: TagLink[],
	screenKey?: ScreenKey,
): number {
	"worklet";
	if (!screenKey) return -1;

	return findLatestIndex(
		stack,
		(link) =>
			!!link.destination && matchesScreenKey(link.destination, screenKey),
	);
}

export function selectSourceUpdateTargetIndex(
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

export function findLinkIndexForDestinationWrite(
	stack: TagLink[],
	destinationScreenKey?: ScreenKey,
	expectedSourceScreenKey?: ScreenKey,
): number {
	"worklet";
	const existingDestinationIndex = findLatestCompletedDestinationIndex(
		stack,
		destinationScreenKey,
	);
	if (existingDestinationIndex !== -1) {
		return existingDestinationIndex;
	}

	const pendingSourceIndex = findLatestPendingSourceLinkIndex(
		stack,
		expectedSourceScreenKey,
	);
	if (pendingSourceIndex !== -1) {
		return pendingSourceIndex;
	}

	return findLatestSourceIndex(stack, expectedSourceScreenKey);
}

export function hasLinkSide(
	stack: TagLink[] | undefined,
	screenKey: ScreenKey,
	side: LinkSide,
): boolean {
	"worklet";
	if (!stack || stack.length === 0) return false;

	return (
		findLatestIndex(stack, (link) =>
			matchesScreenKey(link[side], screenKey),
		) !== -1
	);
}

export function isCompletedLinkForScreenKey(
	link: TagLink,
	screenKey: ScreenKey,
): boolean {
	"worklet";
	return (
		!!link.destination &&
		(matchesScreenKey(link.source, screenKey) ||
			matchesScreenKey(link.destination, screenKey))
	);
}
