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
	source: ({ screenKey: ScreenKey } & TagData) | null;
	destination: ({ screenKey: ScreenKey } & TagData) | null;
};

type TagState = {
	occurrences: Record<ScreenKey, TagData>;
	activeLink: TagLink | null;
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
			state[tag] = { occurrences: {}, activeLink: null };
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

// 1. Called on Press (Source -> Link)
function setLinkSource(
	tag: TagID,
	screenKey: ScreenKey,
	bounds: MeasuredDimensions,
	styles: StyleProps = {},
) {
	"worklet";
	registry.modify((state: Any) => {
		"worklet";
		if (!state[tag]) state[tag] = { occurrences: {}, activeLink: null };

		state[tag].activeLink = {
			source: { screenKey, bounds, styles },
			destination: null,
		};
		return state;
	});
}

// 2. Called on Layout (Destination -> Link)
function setLinkDestination(
	tag: TagID,
	screenKey: ScreenKey,
	bounds: MeasuredDimensions,
	styles: StyleProps = {},
) {
	"worklet";
	registry.modify((state: Any) => {
		"worklet";
		const link = state[tag]?.activeLink;

		// Only set destination if a source is already waiting!
		if (link.source) {
			link.destination = { screenKey, bounds, styles };
		}
		return state;
	});
}

function clearLink(tag: TagID) {
	"worklet";
	registry.modify((state: Any) => {
		"worklet";
		if (state[tag]) {
			state[tag].activeLink = null;
		}
		return state;
	});
}

// --- Getters ---

function getTagState(tag: TagID) {
	"worklet";
	return registry.value[tag] ?? null;
}

function getActiveLink(tag: TagID) {
	"worklet";
	return registry.value[tag]?.activeLink ?? null;
}

function findActiveTagForScreen(screenKey: ScreenKey): TagID | null {
	"worklet";
	const state = registry.value;
	const tags = Object.keys(state);

	for (const tag of tags) {
		const tagData = state[tag];
		const link = tagData.activeLink;

		if (link) {
			// If I am part of the active link (either source or destination)
			if (
				link.source?.screenKey === screenKey ||
				link.destination?.screenKey === screenKey
			) {
				return tag;
			}
		}
	}
	return null;
}

export const BoundStore = {
	registerOccurrence,
	removeOccurrence,
	setLinkSource, // Replaces setActiveSource
	setLinkDestination, // New!
	clearLink,
	getTagState,
	getActiveLink, // Replaces getActiveSource
	findActiveTagForScreen,
	getOccurrence: (tag: TagID, key: ScreenKey) => {
		"worklet";
		return registry.value[tag]?.occurrences[key] ?? null;
	},
};
