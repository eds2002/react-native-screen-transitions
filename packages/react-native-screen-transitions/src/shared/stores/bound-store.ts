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

type TagLink = {
	source: { screenKey: ScreenKey } & TagData;
	destination: ({ screenKey: ScreenKey } & TagData) | null;
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

// Push a new link onto the stack
function setLinkSource(
	tag: TagID,
	screenKey: ScreenKey,
	bounds: MeasuredDimensions,
	styles: StyleProps = {},
) {
	"worklet";
	registry.modify((state: Any) => {
		"worklet";
		if (!state[tag]) state[tag] = { occurrences: {}, linkStack: [] };

		// Push new link onto stack
		state[tag].linkStack.push({
			source: { screenKey, bounds, styles },
			destination: null,
		});
		return state;
	});
}

// Set destination on the top link that's waiting for one
function setLinkDestination(
	tag: TagID,
	screenKey: ScreenKey,
	bounds: MeasuredDimensions,
	styles: StyleProps = {},
) {
	"worklet";
	registry.modify((state: Any) => {
		"worklet";
		const stack = state[tag]?.linkStack;
		if (!stack || stack.length === 0) return state;

		// Find the topmost link without a destination
		for (let i = stack.length - 1; i >= 0; i--) {
			if (stack[i].destination === null) {
				stack[i].destination = { screenKey, bounds, styles };
				break;
			}
		}
		return state;
	});
}

// Remove link(s) involving a screen (call when screen is removed)
function clearLinksForScreen(tag: TagID, screenKey: ScreenKey) {
	"worklet";
	registry.modify((state: Any) => {
		"worklet";
		if (!state[tag]?.linkStack) return state;

		state[tag].linkStack = state[tag].linkStack.filter(
			(link: TagLink) =>
				link.source.screenKey !== screenKey &&
				link.destination?.screenKey !== screenKey,
		);
		return state;
	});
}

// Clear all links for a tag
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

// --- Getters ---

function getTagState(tag: TagID) {
	"worklet";
	return registry.value[tag] ?? null;
}

// Get the active link for a specific screen (finds link where screen is source or destination)
function getActiveLink(tag: TagID, screenKey?: ScreenKey) {
	"worklet";
	const stack = registry.value[tag]?.linkStack;
	if (!stack || stack.length === 0) return null;

	// If screenKey provided, find link involving that screen
	if (screenKey) {
		for (let i = stack.length - 1; i >= 0; i--) {
			const link = stack[i];
			if (
				link.source.screenKey === screenKey ||
				link.destination?.screenKey === screenKey
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
					link.source.screenKey === screenKey ||
					link.destination?.screenKey === screenKey
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
