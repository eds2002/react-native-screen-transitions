import type { MeasuredDimensions, StyleProps } from "react-native-reanimated";
import { matchesScreenKey } from "../helpers/matching";
import type {
	NavigatorKey,
	ScreenKey,
	Snapshot,
	TagID,
	TagLink,
	TagState,
} from "../types";
import {
	createEmptyTagState,
	debugStoreSizeLog,
	type RegistryState,
	registry,
} from "./state";

const LINK_HISTORY_LIMIT = 3;

const ensureTagState = (state: RegistryState, tag: TagID): TagState => {
	"worklet";
	if (!state[tag]) {
		state[tag] = createEmptyTagState();
	}
	return state[tag];
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

const trimLinkHistory = (tagState: TagState) => {
	"worklet";
	const overLimit = tagState.linkStack.length - LINK_HISTORY_LIMIT;
	if (overLimit <= 0) return;
	tagState.linkStack.splice(0, overLimit);
};

function getSnapshot(tag: TagID, key: ScreenKey): Snapshot | null {
	"worklet";
	const tagState = registry.value[tag];
	if (!tagState) return null;

	if (tagState.snapshots[key]) {
		const snap = tagState.snapshots[key];
		return { bounds: snap.bounds, styles: snap.styles };
	}

	for (const screenKey in tagState.snapshots) {
		const snap = tagState.snapshots[screenKey];
		if (snap.ancestorKeys?.includes(key)) {
			return { bounds: snap.bounds, styles: snap.styles };
		}
	}

	return null;
}

function registerSnapshot(
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
		const tagState = ensureTagState(state, tag);
		tagState.snapshots[screenKey] = {
			bounds,
			styles,
			ancestorKeys,
			navigatorKey,
			ancestorNavigatorKeys,
		};
		return state;
	});
	debugStoreSizeLog(`registerSnapshot(${tag},${screenKey})`);
}

function setLinkSource(
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
		const tagState = ensureTagState(state, tag);
		const stack = tagState.linkStack;
		const topIndex = stack.length - 1;
		const topLink = topIndex >= 0 ? stack[topIndex] : null;

		const source = {
			screenKey,
			ancestorKeys,
			navigatorKey,
			ancestorNavigatorKeys,
			bounds,
			styles,
		};

		if (
			topLink &&
			topLink.destination === null &&
			isSameScreenFamily(topLink.source, source)
		) {
			topLink.source = source;
			return state;
		}

		stack.push({ source, destination: null });
		trimLinkHistory(tagState);

		return state;
	});
	debugStoreSizeLog(`setLinkSource(${tag},${screenKey})`);
}

function updateLinkSource(
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
		const tagState = state[tag];
		const stack = tagState?.linkStack;
		if (!stack || stack.length === 0) return state;

		let targetIndex = -1;

		for (let i = stack.length - 1; i >= 0; i--) {
			const link = stack[i];
			if (link.destination && matchesScreenKey(link.source, screenKey)) {
				targetIndex = i;
				break;
			}
		}

		if (targetIndex === -1) {
			for (let i = stack.length - 1; i >= 0; i--) {
				if (matchesScreenKey(stack[i].source, screenKey)) {
					targetIndex = i;
					break;
				}
			}
		}

		if (targetIndex === -1) {
			return state;
		}

		stack[targetIndex].source = {
			screenKey,
			ancestorKeys,
			navigatorKey,
			ancestorNavigatorKeys,
			bounds,
			styles,
		};

		return state;
	});
	debugStoreSizeLog(`updateLinkSource(${tag},${screenKey})`);
}

const findLatestPendingIndex = (
	stack: TagLink[],
	expectedSourceScreenKey?: ScreenKey,
): number => {
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
};

function setLinkDestination(
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
		const tagState = state[tag];
		const stack = tagState?.linkStack;
		if (!stack || stack.length === 0) return state;

		const targetIndex = findLatestPendingIndex(stack, expectedSourceScreenKey);
		if (targetIndex === -1) return state;

		const targetLink = stack[targetIndex];
		if (targetLink.destination !== null) return state;

		targetLink.destination = {
			screenKey,
			ancestorKeys,
			navigatorKey,
			ancestorNavigatorKeys,
			bounds,
			styles,
		};

		return state;
	});
	debugStoreSizeLog(`setLinkDestination(${tag},${screenKey})`);
}

function updateLinkDestination(
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
		const tagState = state[tag];
		const stack = tagState?.linkStack;
		if (!stack || stack.length === 0) return state;

		let targetIndex = -1;

		for (let i = stack.length - 1; i >= 0; i--) {
			const link = stack[i];
			if (link.destination && matchesScreenKey(link.destination, screenKey)) {
				targetIndex = i;
				break;
			}
		}

		if (targetIndex === -1) {
			targetIndex = findLatestPendingIndex(stack, expectedSourceScreenKey);
		}

		if (targetIndex === -1) {
			return state;
		}

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
	debugStoreSizeLog(`updateLinkDestination(${tag},${screenKey})`);
}

function getActiveLink(tag: TagID, screenKey?: ScreenKey): TagLink | null {
	"worklet";
	const tagState = registry.value[tag];
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

function hasPendingLink(tag: TagID): boolean {
	"worklet";
	const tagState = registry.value[tag];
	const stack = tagState?.linkStack;
	if (!stack || stack.length === 0) return false;

	for (let i = stack.length - 1; i >= 0; i--) {
		if (stack[i].destination === null) {
			return true;
		}
	}

	return false;
}

function hasPendingLinkFromSource(
	tag: TagID,
	sourceScreenKey: ScreenKey,
): boolean {
	"worklet";
	const tagState = registry.value[tag];
	const stack = tagState?.linkStack;
	if (!stack || stack.length === 0) return false;

	for (let i = stack.length - 1; i >= 0; i--) {
		const link = stack[i];
		if (link.destination !== null) continue;
		if (matchesScreenKey(link.source, sourceScreenKey)) return true;
	}

	return false;
}

function getLatestPendingSourceScreenKey(tag: TagID): ScreenKey | null {
	"worklet";
	const tagState = registry.value[tag];
	const stack = tagState?.linkStack;
	if (!stack || stack.length === 0) return null;

	for (let i = stack.length - 1; i >= 0; i--) {
		const link = stack[i];
		if (link.destination === null) {
			return link.source.screenKey;
		}
	}

	return null;
}

function hasSourceLink(tag: TagID, screenKey: ScreenKey): boolean {
	"worklet";
	const tagState = registry.value[tag];
	const stack = tagState?.linkStack;
	if (!stack || stack.length === 0) return false;

	for (let i = stack.length - 1; i >= 0; i--) {
		if (matchesScreenKey(stack[i].source, screenKey)) return true;
	}

	return false;
}

function hasDestinationLink(tag: TagID, screenKey: ScreenKey): boolean {
	"worklet";
	const tagState = registry.value[tag];
	const stack = tagState?.linkStack;
	if (!stack || stack.length === 0) return false;

	for (let i = stack.length - 1; i >= 0; i--) {
		if (matchesScreenKey(stack[i].destination, screenKey)) return true;
	}

	return false;
}

export {
	getSnapshot,
	registerSnapshot,
	setLinkSource,
	updateLinkSource,
	setLinkDestination,
	updateLinkDestination,
	getActiveLink,
	hasPendingLink,
	hasPendingLinkFromSource,
	getLatestPendingSourceScreenKey,
	hasSourceLink,
	hasDestinationLink,
};
