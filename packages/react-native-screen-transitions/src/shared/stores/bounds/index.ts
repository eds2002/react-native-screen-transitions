import type { MeasuredDimensions, StyleProps } from "react-native-reanimated";
import { clear, clearByAncestor, clearByBranch } from "./internals/clear";
import { getGroupActiveId, setGroupActiveId } from "./internals/groups";
import {
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
} from "./internals/registry";
import { resolveTransitionPair } from "./internals/resolver";
import type {
	BoundaryConfig,
	MeasuredEntry,
	NavigatorKey,
	ScreenKey,
	TagID,
} from "./types";

export type {
	BoundaryConfig,
	Entry,
	EntryPatch,
	MeasuredEntry,
	ResolvedTransitionPair,
	ResolveTransitionContext,
} from "./types";

export type Snapshot = MeasuredEntry;

const registerSnapshot = (
	tag: TagID,
	screenKey: ScreenKey,
	bounds: MeasuredDimensions,
	styles: StyleProps = {},
	ancestorKeys?: ScreenKey[],
	navigatorKey?: NavigatorKey,
	ancestorNavigatorKeys?: NavigatorKey[],
) => {
	"worklet";
	setEntry(tag, screenKey, {
		bounds,
		styles,
		ancestorKeys,
		navigatorKey,
		ancestorNavigatorKeys,
	});
};

const registerBoundaryPresence = (
	tag: TagID,
	screenKey: ScreenKey,
	ancestorKeys?: ScreenKey[],
	boundaryConfig?: BoundaryConfig,
	navigatorKey?: NavigatorKey,
	ancestorNavigatorKeys?: NavigatorKey[],
) => {
	"worklet";
	const currentPresenceCount = getEntry(tag, screenKey)?.presenceCount ?? 0;
	setEntry(tag, screenKey, {
		ancestorKeys,
		boundaryConfig,
		navigatorKey,
		ancestorNavigatorKeys,
		presenceCount: currentPresenceCount + 1,
	});
};

const unregisterBoundaryPresence = (tag: TagID, screenKey: ScreenKey) => {
	"worklet";
	const currentPresenceCount = getEntry(tag, screenKey)?.presenceCount ?? 0;
	if (currentPresenceCount > 1) {
		setEntry(tag, screenKey, { presenceCount: currentPresenceCount - 1 });
		return;
	}

	removeEntry(tag, screenKey);
};

const getLatestPendingSourceScreenKey = (tag: TagID): ScreenKey | null => {
	"worklet";
	return getPendingLink(tag)?.source.screenKey ?? null;
};

const setLinkSource = (
	tag: TagID,
	screenKey: ScreenKey,
	bounds: MeasuredDimensions,
	styles?: StyleProps,
	ancestorKeys?: ScreenKey[],
	navigatorKey?: NavigatorKey,
	ancestorNavigatorKeys?: NavigatorKey[],
) => {
	"worklet";
	setSource(
		"capture",
		tag,
		screenKey,
		bounds,
		styles,
		ancestorKeys,
		navigatorKey,
		ancestorNavigatorKeys,
	);
};

const updateLinkSource = (
	tag: TagID,
	screenKey: ScreenKey,
	bounds: MeasuredDimensions,
	styles?: StyleProps,
	ancestorKeys?: ScreenKey[],
	navigatorKey?: NavigatorKey,
	ancestorNavigatorKeys?: NavigatorKey[],
) => {
	"worklet";
	setSource(
		"refresh",
		tag,
		screenKey,
		bounds,
		styles,
		ancestorKeys,
		navigatorKey,
		ancestorNavigatorKeys,
	);
};

const setLinkDestination = (
	tag: TagID,
	screenKey: ScreenKey,
	bounds: MeasuredDimensions,
	styles?: StyleProps,
	ancestorKeys?: ScreenKey[],
	expectedSourceScreenKey?: ScreenKey,
	navigatorKey?: NavigatorKey,
	ancestorNavigatorKeys?: NavigatorKey[],
) => {
	"worklet";
	setDestination(
		"attach",
		tag,
		screenKey,
		bounds,
		styles,
		ancestorKeys,
		expectedSourceScreenKey,
		navigatorKey,
		ancestorNavigatorKeys,
	);
};

const updateLinkDestination = (
	tag: TagID,
	screenKey: ScreenKey,
	bounds: MeasuredDimensions,
	styles?: StyleProps,
	ancestorKeys?: ScreenKey[],
	expectedSourceScreenKey?: ScreenKey,
	navigatorKey?: NavigatorKey,
	ancestorNavigatorKeys?: NavigatorKey[],
) => {
	"worklet";
	setDestination(
		"refresh",
		tag,
		screenKey,
		bounds,
		styles,
		ancestorKeys,
		expectedSourceScreenKey,
		navigatorKey,
		ancestorNavigatorKeys,
	);
};

export const BoundStore = {
	entry: {
		set: setEntry,
		get: getEntry,
		getMeasured: getMeasuredEntry,
		getConfig: getEntryConfig,
		remove: removeEntry,
	},
	link: {
		setSource,
		setDestination,
		getActive: getActiveLink,
		getPair: resolveTransitionPair,
		getPending: getPendingLink,
		hasSource: hasSourceLink,
		hasDestination: hasDestinationLink,
	},
	group: {
		setActiveId: setGroupActiveId,
		getActiveId: getGroupActiveId,
	},
	cleanup: {
		byScreen: clear,
		byAncestor: clearByAncestor,
		byBranch: clearByBranch,
	},
	// Legacy flat aliases used by the v3 tests and older internals. New code should
	// prefer the explicit entry/link/group/cleanup namespaces above.
	registerSnapshot,
	getSnapshot: getMeasuredEntry,
	setLinkSource,
	updateLinkSource,
	setLinkDestination,
	updateLinkDestination,
	getActiveLink,
	resolveTransitionPair,
	hasPendingLink: (tag: TagID) => getPendingLink(tag) !== null,
	hasPendingLinkFromSource: (tag: TagID, sourceScreenKey: ScreenKey) =>
		getPendingLink(tag, sourceScreenKey) !== null,
	getLatestPendingSourceScreenKey,
	hasSourceLink,
	hasDestinationLink,
	registerBoundaryPresence,
	unregisterBoundaryPresence,
	hasBoundaryPresence: (tag: TagID, screenKey: ScreenKey) =>
		(getEntry(tag, screenKey)?.presenceCount ?? 0) > 0,
	getBoundaryConfig: getEntryConfig,
	setGroupActiveId,
	getGroupActiveId,
	clear,
	clearByAncestor,
	clearByBranch,
};
