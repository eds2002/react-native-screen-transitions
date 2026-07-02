import type { MeasuredDimensions, StyleProps } from "react-native-reanimated";
import {
	createGroupTag,
	ensurePairGroups,
	ensurePairLinks,
	ensurePairSourceRequests,
	getGroupKeyFromTag,
	getLinkKeyFromTag,
	getActiveGroupId as getPairActiveGroupId,
	getDestination as getPairDestination,
	getLink as getPairLink,
	getSource as getPairSource,
} from "../helpers/link-pairs.helpers";
import type {
	BoundaryRuntimeFlags,
	GroupKey,
	LinkKey,
	LinkPairsState,
	ScreenKey,
	ScreenPairKey,
	SourceTagLinkSide,
	TagID,
	TagLink,
} from "../types";
import { pairs } from "./state";

const syncLinkStatus = (link: TagLink) => {
	"worklet";
	link.status = link.source
		? link.destination
			? "complete"
			: "destination-incomplete"
		: "source-incomplete";
};

type SharedValueLike = {
	_isReanimatedSharedValue: true;
	get?: () => unknown;
	value?: unknown;
};

const isSharedValueLike = (value: unknown): value is SharedValueLike => {
	"worklet";
	return (
		(value as Partial<SharedValueLike> | null)?._isReanimatedSharedValue ===
		true
	);
};

const snapshotSharedValue = (value: SharedValueLike): unknown => {
	"worklet";
	return value.value;
};

const snapshotTransformArrayValue = (
	value: unknown[],
): unknown[] | undefined => {
	"worklet";
	const snapshot: unknown[] = [];

	for (let index = 0; index < value.length; index++) {
		const snapshotValue = snapshotTransformEntryValue(value[index]);
		if (snapshotValue !== undefined) {
			snapshot.push(snapshotValue);
		}
	}

	return snapshot;
};

const snapshotTransformEntryValue = (value: unknown): unknown => {
	"worklet";
	if (isSharedValueLike(value)) {
		return snapshotSharedValue(value);
	}

	if (Array.isArray(value)) {
		return snapshotTransformArrayValue(value);
	}

	if (typeof value === "function") {
		return undefined;
	}

	return value === null || typeof value !== "object" ? value : undefined;
};

const snapshotTransformItem = (value: unknown): unknown => {
	"worklet";
	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return snapshotTransformEntryValue(value);
	}

	const snapshot: Record<string, unknown> = {};
	const source = value as Record<string, unknown>;
	let hasValue = false;

	for (const key in source) {
		const snapshotValue = snapshotTransformEntryValue(source[key]);
		if (snapshotValue !== undefined) {
			snapshot[key] = snapshotValue;
			hasValue = true;
		}
	}

	return hasValue ? snapshot : undefined;
};

const snapshotTransform = (value: unknown): unknown => {
	"worklet";
	if (!Array.isArray(value)) {
		return undefined;
	}

	const snapshot: unknown[] = [];

	for (let index = 0; index < value.length; index++) {
		const snapshotValue = snapshotTransformItem(value[index]);
		if (snapshotValue !== undefined) {
			snapshot.push(snapshotValue);
		}
	}

	return snapshot;
};

/**
 * Link styles are measurement metadata, not a general style serializer.
 * Snapshot only the fields bounds currently consume: primitives, top-level
 * shared values, and transform entries. Object-valued non-transform styles are
 * intentionally omitted to avoid retaining opaque/native style objects.
 */
const snapshotStyles = (styles: StyleProps): StyleProps => {
	"worklet";
	if (!styles || typeof styles !== "object" || Array.isArray(styles)) {
		return {};
	}

	const snapshot: Record<string, unknown> = {};
	const source = styles as Record<string, unknown>;

	for (const key in source) {
		const value = source[key];

		if (key === "transform") {
			const transform = snapshotTransform(value);

			if (transform !== undefined) {
				snapshot.transform = transform;
			}

			continue;
		}

		if (isSharedValueLike(value)) {
			snapshot[key] = snapshotSharedValue(value);
			continue;
		}

		if (value === null || typeof value !== "object") {
			snapshot[key] = value;
		}
	}

	return snapshot as StyleProps;
};

const createLinkSide = (
	screenKey: ScreenKey,
	bounds: MeasuredDimensions,
	styles: StyleProps,
	runtimeFlags: BoundaryRuntimeFlags = {},
) => {
	"worklet";
	return {
		screenKey,
		bounds,
		styles: snapshotStyles(styles),
		handoff: runtimeFlags.handoff ? true : undefined,
		escapeClipping: runtimeFlags.escapeClipping ? true : undefined,
	};
};

const writePairLink = (
	state: LinkPairsState,
	pairKey: ScreenPairKey,
	linkKey: LinkKey,
	link: TagLink,
) => {
	"worklet";
	ensurePairLinks(state, pairKey)[linkKey] = link;
};

const writeGroup = (
	state: LinkPairsState,
	pairKey: ScreenPairKey,
	group: GroupKey,
	activeId: LinkKey,
	initialId?: LinkKey,
) => {
	"worklet";
	const previousInitialId = state[pairKey]?.groups?.[group]?.initialId;

	ensurePairGroups(state, pairKey)[group] = {
		activeId,
		initialId: previousInitialId ?? initialId ?? activeId,
	};
};

const writeDestination = (
	state: LinkPairsState,
	pairKey: ScreenPairKey,
	linkKey: LinkKey,
	screenKey: ScreenKey,
	bounds: MeasuredDimensions,
	styles: StyleProps,
	group?: GroupKey,
) => {
	"worklet";
	const existingLink = getPairLink(state, pairKey, linkKey);

	const destination = createLinkSide(screenKey, bounds, styles);
	const link =
		existingLink ??
		({
			group,
			status: "source-incomplete",
			source: null,
			destination,
			initialDestination: destination,
		} satisfies TagLink);

	link.group = group ?? link.group;
	link.destination = destination;
	if (!link.initialDestination) {
		link.initialDestination = destination;
	}
	syncLinkStatus(link);

	writePairLink(state, pairKey, linkKey, link);

	if (link.group) {
		writeGroup(state, pairKey, link.group, linkKey);
	}
};

function setSource(
	pairKey: ScreenPairKey,
	tag: TagID,
	screenKey: ScreenKey,
	bounds: MeasuredDimensions,
	styles: StyleProps = {},
	group?: GroupKey,
	runtimeFlags: BoundaryRuntimeFlags = {},
) {
	"worklet";
	pairs.modify(<T extends LinkPairsState>(state: T): T => {
		"worklet";
		const linkKey = getLinkKeyFromTag(tag);

		const pairLinks = ensurePairLinks(state, pairKey);

		const existingLink = pairLinks[linkKey];

		const source: SourceTagLinkSide = {
			...createLinkSide(screenKey, bounds, styles, runtimeFlags),
		};
		const link =
			existingLink ??
			({
				group,
				status: "destination-incomplete",
				source,
				destination: null,
				initialSource: source,
			} satisfies TagLink);

		link.group = group ?? link.group;
		link.source = source;
		if (!link.initialSource) {
			link.initialSource = source;
		}
		syncLinkStatus(link);

		pairLinks[linkKey] = link;
		delete state[pairKey]?.sourceRequests?.[linkKey];

		return state;
	});
}

function setDestination(
	pairKey: ScreenPairKey,
	tag: TagID,
	screenKey: ScreenKey,
	bounds: MeasuredDimensions,
	styles: StyleProps = {},
	group?: GroupKey,
) {
	"worklet";
	pairs.modify(<T extends LinkPairsState>(state: T): T => {
		"worklet";
		const linkKey = getLinkKeyFromTag(tag);
		writeDestination(state, pairKey, linkKey, screenKey, bounds, styles, group);

		return state;
	});
}

function setActiveGroupId(pairKey: ScreenPairKey, group: GroupKey, tag: TagID) {
	"worklet";
	pairs.modify(<T extends LinkPairsState>(state: T): T => {
		"worklet";
		writeGroup(state, pairKey, group, getLinkKeyFromTag(tag));
		return state;
	});
}

function requestSourceMeasure(pairKey: ScreenPairKey, tag: TagID) {
	"worklet";
	pairs.modify(<T extends LinkPairsState>(state: T): T => {
		"worklet";
		const linkKey = getLinkKeyFromTag(tag);
		const link = getPairLink(state, pairKey, linkKey);

		if (link?.source || state[pairKey]?.sourceRequests?.[linkKey]) {
			return state;
		}

		ensurePairSourceRequests(state, pairKey)[linkKey] = true;

		return state;
	});
}

function getActiveGroupId(
	pairKey: ScreenPairKey,
	group: GroupKey,
): LinkKey | null {
	"worklet";
	return getPairActiveGroupId(pairs.get(), pairKey, group);
}

function getLink(pairKey: ScreenPairKey, tag: TagID): TagLink | null {
	"worklet";
	return getPairLink(pairs.get(), pairKey, getLinkKeyFromTag(tag));
}

const hasSourceLink = (
	link: TagLink | null,
): link is TagLink & { source: NonNullable<TagLink["source"]> } => {
	"worklet";
	return !!link?.source;
};

function getResolvedLink(
	pairKey: ScreenPairKey,
	tag: TagID,
): { tag: TagID; link: TagLink | null } {
	"worklet";
	const state = pairs.get();
	const linkKey = getLinkKeyFromTag(tag);
	const group = getGroupKeyFromTag(tag);
	const link = getPairLink(state, pairKey, linkKey);

	// Group active ids can update before the new member has a full source/destination
	// link. As soon as the requested member has source bounds, prefer it; only
	// fall back while the requested member has no source yet.
	if (!group || hasSourceLink(link)) {
		return {
			tag,
			link,
		};
	}

	const initialId = state[pairKey]?.groups?.[group]?.initialId;
	if (initialId) {
		const initialLink = getPairLink(state, pairKey, initialId);

		if (hasSourceLink(initialLink)) {
			return {
				tag: createGroupTag(group, initialId),
				link: initialLink,
			};
		}
	}

	return {
		tag,
		link,
	};
}

function getSource(
	pairKey: ScreenPairKey,
	tag: TagID,
): TagLink["source"] | null {
	"worklet";
	return getPairSource(pairs.get(), pairKey, getLinkKeyFromTag(tag));
}

function getDestination(
	pairKey: ScreenPairKey,
	tag: TagID,
): TagLink["destination"] | null {
	"worklet";
	return getPairDestination(pairs.get(), pairKey, getLinkKeyFromTag(tag));
}

export {
	getActiveGroupId,
	getDestination,
	getLink,
	getResolvedLink,
	getSource,
	requestSourceMeasure,
	setActiveGroupId,
	setDestination,
	setSource,
};
