import {
	type MeasuredDimensions,
	makeMutable,
	type StyleProps,
} from "react-native-reanimated";
import type { Any } from "../types/utils";

type TagID = string;
type ScreenKey = string;

type TagData = {
	bounds: MeasuredDimensions;
	styles: StyleProps;
};

type ScreenIdentifier = {
	screenKey: ScreenKey;
	parentScreenKey?: ScreenKey;
};

type TagLink = {
	source: ScreenIdentifier & TagData;
	destination: (ScreenIdentifier & TagData) | null;
};

type TagState = {
	occurrences: Record<ScreenKey, TagData>;
	linkStack: TagLink[];
};

const registry = makeMutable<Record<TagID, TagState>>({});

function registerOccurrence(
	tag: TagID,
	screenKey: ScreenKey,
	bounds: MeasuredDimensions,
	styles: StyleProps = {},
) {
	"worklet";
	registry.modify((state: Any) => {
		"worklet";
		if (!state[tag]) {
			state[tag] = { occurrences: {}, linkStack: [] };
		}
		state[tag].occurrences[screenKey] = { bounds, styles };
		return state;
	});
}

function removeOccurrence(tag: TagID, screenKey: ScreenKey) {
	"worklet";
	registry.modify((state: Any) => {
		"worklet";
		if (state[tag]?.occurrences[screenKey]) {
			delete state[tag].occurrences[screenKey];
		}
		return state;
	});
}

function setLinkSource(
	tag: TagID,
	screenKey: ScreenKey,
	bounds: MeasuredDimensions,
	styles: StyleProps = {},
	parentScreenKey?: ScreenKey,
) {
	"worklet";
	registry.modify((state: Any) => {
		"worklet";
		if (!state[tag]) state[tag] = { occurrences: {}, linkStack: [] };

		// Push new link onto stack
		state[tag].linkStack.push({
			source: { screenKey, parentScreenKey, bounds, styles },
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
	parentScreenKey?: ScreenKey,
) {
	"worklet";
	registry.modify((state: Any) => {
		"worklet";
		const stack = state[tag]?.linkStack;
		if (!stack || stack.length === 0) return state;

		// Find the topmost link without a destination
		for (let i = stack.length - 1; i >= 0; i--) {
			if (stack[i].destination === null) {
				stack[i].destination = { screenKey, parentScreenKey, bounds, styles };
				break;
			}
		}
		return state;
	});
}

function clearLinksForScreen(tag: TagID, screenKey: ScreenKey) {
	"worklet";
	registry.modify((state: Any) => {
		"worklet";
		if (!state[tag]?.linkStack) return state;

		state[tag].linkStack = state[tag].linkStack.filter(
			(link: TagLink) =>
				link.source.screenKey !== screenKey &&
				link.source.parentScreenKey !== screenKey &&
				link.destination?.screenKey !== screenKey &&
				link.destination?.parentScreenKey !== screenKey,
		);
		return state;
	});
}

function clearLink(tag: TagID) {
	"worklet";
	registry.modify((state: Any) => {
		"worklet";
		if (state[tag]) {
			state[tag].linkStack = [];
		}
		return state;
	});
}

function getTagState(tag: TagID) {
	"worklet";
	return registry.value[tag] ?? null;
}

// Helper to check if a screen identifier matches a given key
function matchesScreenKey(
	identifier: ScreenIdentifier | null | undefined,
	key: ScreenKey,
): boolean {
	"worklet";
	if (!identifier) return false;
	return identifier.screenKey === key || identifier.parentScreenKey === key;
}

// Get the active link for a specific screen (finds link where screen is source or destination)
function getActiveLink(tag: TagID, screenKey?: ScreenKey, isClosing?: boolean) {
	"worklet";
	const stack = registry.value[tag]?.linkStack;

	if (!stack || stack.length === 0) return null;

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

	// Otherwise return top complete link
	for (let i = stack.length - 1; i >= 0; i--) {
		if (stack[i].destination !== null) {
			return stack[i];
		}
	}
	return null;
}

function findActiveTagForScreen(screenKey: ScreenKey): TagID | null {
	"worklet";
	const state = registry.value;
	const tags = Object.keys(state);

	for (const tag of tags) {
		const tagData = state[tag];
		const stack = tagData.linkStack;

		if (stack) {
			for (const link of stack) {
				if (
					matchesScreenKey(link.source, screenKey) ||
					matchesScreenKey(link.destination, screenKey)
				) {
					return tag;
				}
			}
		}
	}
	return null;
}

export const BoundStore = {
	registerOccurrence,
	removeOccurrence,
	setLinkSource,
	setLinkDestination,
	clearLink,
	clearLinksForScreen,
	getTagState,
	getActiveLink,
	findActiveTagForScreen,
	getOccurrence: (tag: TagID, key: ScreenKey) => {
		"worklet";
		return registry.value[tag]?.occurrences[key] ?? null;
	},
};
