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

/**
 * Get a pair of snapshots (from/to) for a shared element transition.
 * Returns the active link's source and destination snapshots.
 */
function getPair(
	tag: TagID,
	screenKey?: ScreenKey,
	isClosing?: boolean,
): { from: Snapshot; to: Snapshot } | null {
	"worklet";
	const link = getActiveLink(tag, screenKey, isClosing);
	if (!link || !link.destination) return null;

	return {
		from: { bounds: link.source.bounds, styles: link.source.styles },
		to: { bounds: link.destination.bounds, styles: link.destination.styles },
	};
}

function getActiveLink(tag: TagID, screenKey?: ScreenKey, isClosing?: boolean) {
	"worklet";
	const stack = registry.value[tag]?.linkStack;

	if (!stack || stack.length === 0) {
		return null;
	}

	// If screenKey provided, find link involving that screen
	if (screenKey) {
		// When closing (backward nav), we want the link where this screen is the DESTINATION
		// When opening (forward nav), we want the link where this screen is the DESTINATION too
		// The source is always the "from" screen, destination is the "to" screen

		if (isClosing) {
			// Backward: find link where I am the destination (I'm going back to source)
			for (let i = stack.length - 1; i >= 0; i--) {
				const link = stack[i];
				if (matchesScreenKey(link.destination, screenKey)) {
					return link;
				}
			}
		}

		// Forward or fallback: find any link involving this screen
		for (let i = stack.length - 1; i >= 0; i--) {
			const link = stack[i];
			if (
				matchesScreenKey(link.source, screenKey) ||
				matchesScreenKey(link.destination, screenKey)
			) {
				return link;
			}
		}
		return null;
	}

	return stack[stack.length - 1] ?? null;
}

export const BoundStore = {
	registerSnapshot,
	setLinkSource,
	setLinkDestination,
	getActiveLink,
	getSnapshot,
	getPair,
};
