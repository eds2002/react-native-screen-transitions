import type { MeasuredDimensions, StyleProps } from "react-native-reanimated";
import type {
	EntryPatch,
	NavigatorKey,
	ScreenEntry,
	ScreenKey,
	TagID,
	TagLink,
} from "../types";
import {
	applyEntryPatch,
	ensureScreenEntry,
	ensureTagState,
	findLatestPendingSourceLinkIndex,
	findLinkIndexForDestinationWrite,
	findMatchingScreenEntry,
	hasLinkSide,
	isCompletedLinkForScreenKey,
	isSameScreenFamily,
	pruneTagState,
	selectSourceUpdateTargetIndex,
} from "./registry.helpers";
import { type RegistryState, registry } from "./state";

type LinkSourceWriteMode = "capture" | "refresh";
type LinkDestinationWriteMode = "attach" | "refresh";

function getEntry(tag: TagID, key: ScreenKey): ScreenEntry | null {
	"worklet";
	return findMatchingScreenEntry(registry.get()[tag], key);
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
		const targetIndex = findLinkIndexForDestinationWrite(
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
		if (isCompletedLinkForScreenKey(link, screenKey)) {
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

	const pendingSourceLinkIndex = findLatestPendingSourceLinkIndex(
		stack,
		sourceScreenKey,
	);
	if (pendingSourceLinkIndex === -1) return null;
	return stack[pendingSourceLinkIndex] ?? null;
}

function hasSourceLink(tag: TagID, screenKey: ScreenKey): boolean {
	"worklet";
	return hasLinkSide(registry.get()[tag]?.linkStack, screenKey, "source");
}

function hasDestinationLink(tag: TagID, screenKey: ScreenKey): boolean {
	"worklet";
	return hasLinkSide(registry.get()[tag]?.linkStack, screenKey, "destination");
}

export {
	getActiveLink,
	getEntry,
	getPendingLink,
	hasDestinationLink,
	hasSourceLink,
	removeEntry,
	setDestination,
	setEntry,
	setSource,
};
