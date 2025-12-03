import {
	type MeasuredDimensions,
	makeMutable,
	type StyleProps,
} from "react-native-reanimated";
import type { Any } from "../types/utils.types";

type TagID = string;
type ScreenKey = string;

export type TagData = {
	bounds: MeasuredDimensions;
	styles: StyleProps;
};

type ScreenIdentifier = {
	screenKey: ScreenKey;
	ancestorKeys?: ScreenKey[];
};

type TagLink = {
	source: ScreenIdentifier & TagData;
	destination: (ScreenIdentifier & TagData) | null;
};

type TagState = {
	occurrences: Record<ScreenKey, TagData & { ancestorKeys?: ScreenKey[] }>;
	linkStack: TagLink[];
};

/**
 * Note on cleanup: We intentionally skip automatic cleanup of old links.
 * The linkStack grows by one entry per navigation, but `getActiveLink`
 * finds the correct link via screenKey matching regardless of stack size.
 * This is unlikely to cause performance issues in typical apps, but if
 * memory becomes a concern in apps with heavy navigation (hundreds of
 * transitions), we should consider implementing cleanup on screen unmount using
 * screenKey filtering.
 */
const registry = makeMutable<Record<TagID, TagState>>({});

function registerOccurrence(
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
			state[tag] = { occurrences: {}, linkStack: [] };
		}
		state[tag].occurrences[screenKey] = { bounds, styles, ancestorKeys };
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
		if (!state[tag]) state[tag] = { occurrences: {}, linkStack: [] };

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
 * Get occurrence by tag and key.
 * Supports ancestor matching - if the key matches any ancestor of a stored occurrence,
 * that occurrence will be returned.
 */
function getOccurrence(tag: TagID, key: ScreenKey): TagData | null {
	"worklet";
	const tagState = registry.value[tag];
	if (!tagState) return null;

	// Direct match in occurrences
	if (tagState.occurrences[key]) {
		const occ = tagState.occurrences[key];
		return { bounds: occ.bounds, styles: occ.styles };
	}

	// Ancestor match
	for (const screenKey in tagState.occurrences) {
		const occ = tagState.occurrences[screenKey];
		if (occ.ancestorKeys?.includes(key)) {
			return { bounds: occ.bounds, styles: occ.styles };
		}
	}

	return null;
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
	registerOccurrence,
	setLinkSource,
	setLinkDestination,
	getActiveLink,
	getOccurrence,
};
