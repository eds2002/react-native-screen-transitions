import {
	type MeasuredDimensions,
	makeMutable,
	type StyleProps,
} from "react-native-reanimated";
import type { Any } from "../types/utils.types";

type TagID = string;
type ScreenKey = string;

export type Snapshot = {
	bounds: MeasuredDimensions;
	styles: StyleProps;
};

type ScreenIdentifier = {
	screenKey: ScreenKey;
	ancestorKeys?: ScreenKey[];
};

type TagLink = {
	source: ScreenIdentifier & Snapshot;
	destination: (ScreenIdentifier & Snapshot) | null;
};

type TagState = {
	snapshots: Record<ScreenKey, Snapshot & { ancestorKeys?: ScreenKey[] }>;
	linkStack: TagLink[];
};

const registry = makeMutable<Record<TagID, TagState>>({});

function registerSnapshot(
	tag: TagID,
	screenKey: ScreenKey,
	bounds: MeasuredDimensions,
	styles: StyleProps = {},
	ancestorKeys?: ScreenKey[],
) {
	"worklet";
	registry.modify((state: Any) => {
		"worklet";
		if (!state[tag]) {
			state[tag] = { snapshots: {}, linkStack: [] };
		}
		state[tag].snapshots[screenKey] = { bounds, styles, ancestorKeys };
		return state;
	});
}

function setLinkSource(
	tag: TagID,
	screenKey: ScreenKey,
	bounds: MeasuredDimensions,
	styles: StyleProps = {},
	ancestorKeys?: ScreenKey[],
) {
	"worklet";
	registry.modify((state: Any) => {
		"worklet";
		if (!state[tag]) state[tag] = { snapshots: {}, linkStack: [] };

		state[tag].linkStack.push({
			source: { screenKey, ancestorKeys, bounds, styles },
			destination: null,
		});
		return state;
	});
}

function setLinkDestination(
	tag: TagID,
	screenKey: ScreenKey,
	bounds: MeasuredDimensions,
	styles: StyleProps = {},
	ancestorKeys?: ScreenKey[],
) {
	"worklet";
	registry.modify((state: Any) => {
		"worklet";
		const stack = state[tag]?.linkStack;
		if (!stack || stack.length === 0) return state;

		// Find the topmost link without a destination
		for (let i = stack.length - 1; i >= 0; i--) {
			if (stack[i].destination === null) {
				stack[i].destination = { screenKey, ancestorKeys, bounds, styles };
				break;
			}
		}
		return state;
	});
}

/**
 * Helper to check if a screen identifier matches a given key.
 * Checks both direct screenKey match and ancestor chain.
 */
function matchesScreenKey(
	identifier: ScreenIdentifier | null | undefined,
	key: ScreenKey,
): boolean {
	"worklet";
	if (!identifier) return false;

	// Direct match
	if (identifier.screenKey === key) return true;

	// Check ancestor chain
	return identifier.ancestorKeys?.includes(key) ?? false;
}

/**
 * Get snapshot by tag and optional key.
 * If key is provided, supports ancestor matching - if the key matches any ancestor
 * of a stored snapshot, that snapshot will be returned.
 * If key is omitted, returns the most recently registered snapshot.
 */
function getSnapshot(tag: TagID, key: ScreenKey): Snapshot | null {
	"worklet";
	const tagState = registry.value[tag];
	if (!tagState) return null;

	// Direct match in occurrences
	if (tagState.snapshots[key]) {
		const snap = tagState.snapshots[key];
		return { bounds: snap.bounds, styles: snap.styles };
	}

	// Ancestor match
	for (const screenKey in tagState.snapshots) {
		const snap = tagState.snapshots[screenKey];
		if (snap.ancestorKeys?.includes(key)) {
			return { bounds: snap.bounds, styles: snap.styles };
		}
	}

	return null;
}

function getActiveLink(tag: TagID, screenKey?: ScreenKey): TagLink | null {
	"worklet";
	const stack = registry.value[tag]?.linkStack;

	if (!stack || stack.length === 0) {
		return null;
	}

	// If screenKey provided, find link involving that screen
	if (screenKey) {
		for (let i = stack.length - 1; i >= 0; i--) {
			const link = stack[i];
			if (!link.destination) continue;

			const isSource = matchesScreenKey(link.source, screenKey);
			const isDestination = matchesScreenKey(link.destination, screenKey);

			if (isSource || isDestination) {
				// If I match the source, I'm closing (going back to where I came from)
				return link;
			}
		}
		return null;
	}

	const lastLink = stack[stack.length - 1];
	return lastLink ? lastLink : null;
}

/**
 * Clear all snapshots and links for a screen across all tags.
 * Called when a screen unmounts.
 */
function clear(screenKey: ScreenKey) {
	"worklet";
	registry.modify((state: Any) => {
		"worklet";
		for (const tag in state) {
			// Remove snapshot
			if (state[tag].snapshots[screenKey]) {
				delete state[tag].snapshots[screenKey];
			}

			// Remove links involving this screen
			state[tag].linkStack = state[tag].linkStack.filter((link: TagLink) => {
				const sourceMatches = matchesScreenKey(link.source, screenKey);
				const destMatches = matchesScreenKey(link.destination, screenKey);
				return !sourceMatches && !destMatches;
			});
		}
		return state;
	});
}

export const BoundStore = {
	registerSnapshot,
	setLinkSource,
	setLinkDestination,
	getActiveLink,
	getSnapshot,
	clear,
};
