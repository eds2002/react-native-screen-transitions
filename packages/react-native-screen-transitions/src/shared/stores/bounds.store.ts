import {
	type MeasuredDimensions,
	makeMutable,
	type StyleProps,
} from "react-native-reanimated";
import type { BoundsMethod } from "../types/bounds.types";
import type {
	BoundsAnchor,
	BoundsScaleMode,
} from "../utils/bounds/types/options";

type TagID = string;
type ScreenKey = string;

export type BoundaryConfig = {
	anchor?: BoundsAnchor;
	scaleMode?: BoundsScaleMode;
	target?: "bound" | "fullscreen" | MeasuredDimensions;
	method?: BoundsMethod;
};

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

export type ResolveTransitionContext = {
	currentScreenKey?: ScreenKey;
	previousScreenKey?: ScreenKey;
	nextScreenKey?: ScreenKey;
	entering: boolean;
};

export type ResolvedTransitionPair = {
	sourceBounds: MeasuredDimensions | null;
	destinationBounds: MeasuredDimensions | null;
	sourceScreenKey: ScreenKey | null;
	destinationScreenKey: ScreenKey | null;
	usedPending: boolean;
	usedSnapshotSource: boolean;
	usedSnapshotDestination: boolean;
};

type TagState = {
	snapshots: Record<ScreenKey, Snapshot & { ancestorKeys?: ScreenKey[] }>;
	linkStack: TagLink[];
};

type PresenceEntry = {
	count: number;
	ancestorKeys?: ScreenKey[];
	boundaryConfig?: BoundaryConfig;
};

type PresenceState = Record<TagID, Record<ScreenKey, PresenceEntry>>;

const registry = makeMutable<Record<TagID, TagState>>({});
const presence = makeMutable<PresenceState>({});

/**
 * Group registry — tracks the currently-active boundary id per group.
 * Used for collection/list scenarios where multiple boundaries share a group
 * and the active member can change (e.g., scrolling a pager in a detail screen).
 */
type GroupState = {
	activeId: string;
};

const groups = makeMutable<Record<string, GroupState>>({});
const RESOLVER_LOG_PREFIX = "[bounds:resolver]";
const ENABLE_RESOLVER_DEBUG_LOGS = false;

function debugResolverLog(message: string) {
	"worklet";
	if (!ENABLE_RESOLVER_DEBUG_LOGS) return;
	console.warn(`${RESOLVER_LOG_PREFIX} ${message}`);
}

function registerSnapshot(
	tag: TagID,
	screenKey: ScreenKey,
	bounds: MeasuredDimensions,
	styles: StyleProps = {},
	ancestorKeys?: ScreenKey[],
) {
	"worklet";
	registry.modify((state: any) => {
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
	registry.modify((state: any) => {
		"worklet";
		if (!state[tag]) state[tag] = { snapshots: {}, linkStack: [] };

		const stack = state[tag].linkStack;
		const topLink = stack[stack.length - 1];

		// Spam-safety: if the top link is still pending and comes from the same
		// source screen (or ancestor chain), update it in place instead of pushing
		// another pending link. This prevents duplicate pending links for repeated
		// taps on the same element while a transition is in flight.
		if (topLink && topLink.destination === null) {
			const topSource = topLink.source;
			const sameSource =
				topSource &&
				(topSource.screenKey === screenKey ||
					(topSource.ancestorKeys?.includes(screenKey) ?? false) ||
					(ancestorKeys?.includes(topSource.screenKey) ?? false));

			if (sameSource) {
				topLink.source = { screenKey, ancestorKeys, bounds, styles };
				return state;
			}
		}

		stack.push({
			source: { screenKey, ancestorKeys, bounds, styles },
			destination: null,
		});
		return state;
	});
}

function updateLinkSource(
	tag: TagID,
	screenKey: ScreenKey,
	bounds: MeasuredDimensions,
	styles: StyleProps = {},
	ancestorKeys?: ScreenKey[],
) {
	"worklet";
	registry.modify((state: any) => {
		"worklet";
		const stack = state[tag]?.linkStack;
		if (!stack || stack.length === 0) return state;

		let targetIndex = -1;

		// Prefer the most recent completed link first.
		// NOTE: matchesScreenKey is inlined here to avoid a Reanimated
		// workletization crash caused by nested worklet function calls
		// inside registry.modify callbacks.
		for (let i = stack.length - 1; i >= 0; i--) {
			const link = stack[i];
			const src = link.source;
			const srcMatches =
				src &&
				(src.screenKey === screenKey ||
					(src.ancestorKeys?.includes(screenKey) ?? false));
			if (link.destination && srcMatches) {
				targetIndex = i;
				break;
			}
		}

		// Fallback to pending links when no completed link matches.
		if (targetIndex === -1) {
			for (let i = stack.length - 1; i >= 0; i--) {
				const src = stack[i].source;
				if (
					src &&
					(src.screenKey === screenKey ||
						(src.ancestorKeys?.includes(screenKey) ?? false))
				) {
					targetIndex = i;
					break;
				}
			}
		}

		if (targetIndex !== -1) {
			stack[targetIndex].source = { screenKey, ancestorKeys, bounds, styles };
		}

		return state;
	});
}

function setLinkDestination(
	tag: TagID,
	screenKey: ScreenKey,
	bounds: MeasuredDimensions,
	styles: StyleProps = {},
	ancestorKeys?: ScreenKey[],
	expectedSourceScreenKey?: ScreenKey,
) {
	"worklet";
	registry.modify((state: any) => {
		"worklet";
		const stack = state[tag]?.linkStack;
		if (!stack || stack.length === 0) return state;

		let targetIndex = -1;

		if (expectedSourceScreenKey) {
			for (let i = stack.length - 1; i >= 0; i--) {
				const link = stack[i];
				if (link.destination !== null) continue;

				const src = link.source;
				const sourceMatches =
					src &&
					(src.screenKey === expectedSourceScreenKey ||
						(src.ancestorKeys?.includes(expectedSourceScreenKey) ?? false));

				if (sourceMatches) {
					targetIndex = i;
					break;
				}
			}

			// In expected-source mode, do not fall back to unrelated pending links.
			if (targetIndex === -1) {
				return state;
			}
		} else {
			// Legacy behavior: pick the topmost pending link.
			for (let i = stack.length - 1; i >= 0; i--) {
				if (stack[i].destination === null) {
					targetIndex = i;
					break;
				}
			}
		}

		if (targetIndex !== -1) {
			stack[targetIndex].destination = {
				screenKey,
				ancestorKeys,
				bounds,
				styles,
			};
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

function findCompletedLinkByDestination(
	stack: TagLink[],
	screenKey?: ScreenKey,
): TagLink | null {
	"worklet";
	if (!screenKey) return null;

	for (let i = stack.length - 1; i >= 0; i--) {
		const link = stack[i];
		if (!link.destination) continue;
		if (matchesScreenKey(link.destination, screenKey)) {
			return link;
		}
	}

	return null;
}

function findCompletedLinkBySource(
	stack: TagLink[],
	screenKey?: ScreenKey,
): TagLink | null {
	"worklet";
	if (!screenKey) return null;

	for (let i = stack.length - 1; i >= 0; i--) {
		const link = stack[i];
		if (!link.destination) continue;
		if (matchesScreenKey(link.source, screenKey)) {
			return link;
		}
	}

	return null;
}

function findPendingLinkBySource(
	stack: TagLink[],
	screenKey?: ScreenKey,
): TagLink | null {
	"worklet";
	if (!screenKey) return null;

	for (let i = stack.length - 1; i >= 0; i--) {
		const link = stack[i];
		if (link.destination !== null) continue;
		if (matchesScreenKey(link.source, screenKey)) {
			return link;
		}
	}

	return null;
}

function getSnapshotBoundsByPriority(
	tag: TagID,
	keys: (ScreenKey | undefined)[],
): { bounds: MeasuredDimensions; screenKey: ScreenKey } | null {
	"worklet";

	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		if (!key) continue;
		const snapshot = getSnapshot(tag, key);
		if (!snapshot) continue;
		return {
			bounds: snapshot.bounds,
			screenKey: key,
		};
	}

	return null;
}

function resolveTransitionPair(
	tag: TagID,
	context: ResolveTransitionContext,
): ResolvedTransitionPair {
	"worklet";

	const stack = registry.value[tag]?.linkStack;

	let matchedLink: TagLink | null = null;
	let usedPending = false;

	if (stack && stack.length > 0) {
		if (context.entering) {
			matchedLink = findCompletedLinkByDestination(
				stack,
				context.currentScreenKey,
			);

			if (!matchedLink) {
				matchedLink = findPendingLinkBySource(stack, context.previousScreenKey);
				usedPending = !!matchedLink;
			}

			if (!matchedLink) {
				matchedLink = findCompletedLinkBySource(
					stack,
					context.previousScreenKey,
				);
			}

			if (!matchedLink) {
				matchedLink = findCompletedLinkByDestination(
					stack,
					context.nextScreenKey,
				);
			}
		} else {
			matchedLink = findCompletedLinkBySource(stack, context.currentScreenKey);

			if (!matchedLink) {
				matchedLink = findCompletedLinkByDestination(
					stack,
					context.nextScreenKey,
				);
			}

			if (!matchedLink) {
				matchedLink = findPendingLinkBySource(stack, context.currentScreenKey);
				usedPending = !!matchedLink;
			}
		}
	}

	let sourceBounds = matchedLink?.source?.bounds ?? null;
	let destinationBounds = matchedLink?.destination?.bounds ?? null;
	let sourceScreenKey = matchedLink?.source?.screenKey ?? null;
	let destinationScreenKey = matchedLink?.destination?.screenKey ?? null;
	let usedSnapshotSource = false;
	let usedSnapshotDestination = false;

	const sourceFallbackKeys = context.entering
		? [
				context.previousScreenKey,
				context.currentScreenKey,
				context.nextScreenKey,
			]
		: [
				context.currentScreenKey,
				context.previousScreenKey,
				context.nextScreenKey,
			];

	const destinationFallbackKeys = context.entering
		? [context.currentScreenKey, context.nextScreenKey]
		: [context.nextScreenKey, context.currentScreenKey];

	if (!sourceBounds) {
		const sourceSnapshot = getSnapshotBoundsByPriority(tag, sourceFallbackKeys);
		if (sourceSnapshot) {
			sourceBounds = sourceSnapshot.bounds;
			sourceScreenKey = sourceSnapshot.screenKey;
			usedSnapshotSource = true;
		}
	}

	if (!destinationBounds) {
		const destinationSnapshot = getSnapshotBoundsByPriority(
			tag,
			destinationFallbackKeys,
		);
		if (destinationSnapshot) {
			destinationBounds = destinationSnapshot.bounds;
			destinationScreenKey = destinationSnapshot.screenKey;
			usedSnapshotDestination = true;
		}
	}

	if (!sourceBounds || !destinationBounds) {
		debugResolverLog(
			`unresolved tag=${tag} entering=${context.entering ? 1 : 0} source=${
				sourceBounds ? 1 : 0
			} destination=${destinationBounds ? 1 : 0} pending=${usedPending ? 1 : 0}`,
		);
	}

	return {
		sourceBounds,
		destinationBounds,
		sourceScreenKey,
		destinationScreenKey,
		usedPending,
		usedSnapshotSource,
		usedSnapshotDestination,
	};
}

function registerBoundaryPresence(
	tag: TagID,
	screenKey: ScreenKey,
	ancestorKeys?: ScreenKey[],
	boundaryConfig?: BoundaryConfig,
) {
	"worklet";
	const current = presence.value;
	const tagEntries = current[tag] ?? {};
	const currentEntry = tagEntries[screenKey];

	presence.value = {
		...current,
		[tag]: {
			...tagEntries,
			[screenKey]: {
				count: (currentEntry?.count ?? 0) + 1,
				ancestorKeys: ancestorKeys ?? currentEntry?.ancestorKeys,
				boundaryConfig: boundaryConfig ?? currentEntry?.boundaryConfig,
			},
		},
	};
}

function getBoundaryConfig(
	tag: TagID,
	screenKey: ScreenKey,
): BoundaryConfig | null {
	"worklet";
	const tagEntries = presence.value[tag];
	if (!tagEntries) return null;

	const direct = tagEntries[screenKey];
	if (direct && direct.count > 0) {
		return direct.boundaryConfig ?? null;
	}

	for (const entryScreenKey in tagEntries) {
		const entry = tagEntries[entryScreenKey];
		if (entry.count <= 0) continue;
		if (entry.ancestorKeys?.includes(screenKey)) {
			return entry.boundaryConfig ?? null;
		}
	}

	return null;
}

function unregisterBoundaryPresence(tag: TagID, screenKey: ScreenKey) {
	"worklet";
	const current = presence.value;
	const tagEntries = current[tag];
	if (!tagEntries) return;

	const currentEntry = tagEntries[screenKey];
	if (!currentEntry) return;

	const nextCount = currentEntry.count - 1;

	if (nextCount > 0) {
		presence.value = {
			...current,
			[tag]: {
				...tagEntries,
				[screenKey]: {
					...currentEntry,
					count: nextCount,
				},
			},
		};
		return;
	}

	const { [screenKey]: _removed, ...remainingForTag } = tagEntries;
	if (Object.keys(remainingForTag).length === 0) {
		const { [tag]: _removedTag, ...remainingPresence } = current;
		presence.value = remainingPresence;
		return;
	}

	presence.value = {
		...current,
		[tag]: remainingForTag,
	};
}

function hasBoundaryPresence(tag: TagID, screenKey: ScreenKey): boolean {
	"worklet";
	const tagEntries = presence.value[tag];
	if (!tagEntries) return false;

	const direct = tagEntries[screenKey];
	if (direct && direct.count > 0) return true;

	for (const entryScreenKey in tagEntries) {
		const entry = tagEntries[entryScreenKey];
		if (entry.ancestorKeys?.includes(screenKey)) {
			return true;
		}
	}

	return false;
}

function getBoundaryPresence() {
	"worklet";
	return presence;
}

/**
 * Returns true when a tag has at least one link waiting for destination.
 */
function hasPendingLink(tag: TagID): boolean {
	"worklet";
	const stack = registry.value[tag]?.linkStack;
	if (!stack || stack.length === 0) return false;

	for (let i = stack.length - 1; i >= 0; i--) {
		if (stack[i].destination === null) return true;
	}

	return false;
}

/**
 * Returns true when a tag has a pending link whose source matches
 * the provided screen (or one of its ancestors).
 */
function hasPendingLinkFromSource(
	tag: TagID,
	sourceScreenKey: ScreenKey,
): boolean {
	"worklet";
	const stack = registry.value[tag]?.linkStack;
	if (!stack || stack.length === 0) return false;

	for (let i = stack.length - 1; i >= 0; i--) {
		const link = stack[i];
		if (link.destination !== null) continue;
		if (matchesScreenKey(link.source, sourceScreenKey)) return true;
	}

	return false;
}

/**
 * Returns the source screen key of the most recent pending link for a tag.
 */
function getLatestPendingSourceScreenKey(tag: TagID): ScreenKey | null {
	"worklet";
	const stack = registry.value[tag]?.linkStack;
	if (!stack || stack.length === 0) return null;

	for (let i = stack.length - 1; i >= 0; i--) {
		const link = stack[i];
		if (link.destination === null) {
			return link.source.screenKey;
		}
	}

	return null;
}

/**
 * Returns true when the given screen (or one of its ancestors) is a source
 * in the link stack for the provided tag.
 */
function hasSourceLink(tag: TagID, screenKey: ScreenKey): boolean {
	"worklet";
	const stack = registry.value[tag]?.linkStack;
	if (!stack || stack.length === 0) return false;

	for (let i = stack.length - 1; i >= 0; i--) {
		if (matchesScreenKey(stack[i].source, screenKey)) return true;
	}

	return false;
}

/**
 * Returns true when the given screen (or one of its ancestors) is a destination
 * in the link stack for the provided tag.
 */
function hasDestinationLink(tag: TagID, screenKey: ScreenKey): boolean {
	"worklet";
	const stack = registry.value[tag]?.linkStack;
	if (!stack || stack.length === 0) return false;

	for (let i = stack.length - 1; i >= 0; i--) {
		if (matchesScreenKey(stack[i].destination, screenKey)) return true;
	}

	return false;
}

/**
 * Set the currently-active boundary id for a group.
 * Called by the bounds accessor when a new id is requested for a group.
 */
function setGroupActiveId(group: string, id: string) {
	"worklet";
	// IMPORTANT: Use direct .value assignment (not .modify) to ensure
	// useAnimatedReaction properly detects the change. .modify() mutates
	// in-place which doesn't reliably trigger Reanimated's dependency tracking.
	groups.value = { ...groups.value, [group]: { activeId: id } };
}

/**
 * Get the currently-active boundary id for a group.
 * Returns null if the group has no tracked active id.
 */
function getGroupActiveId(group: string): string | null {
	"worklet";
	return groups.value[group]?.activeId ?? null;
}
function getGroups() {
	"worklet";
	return groups;
}

/**
 * Update the destination bounds of an existing link.
 * Mirror of updateLinkSource — finds the most recent link for a tag where
 * the destination matches the given screen key and updates its bounds.
 * Also handles the case where destination was null (measure failed at mount).
 */
function updateLinkDestination(
	tag: TagID,
	screenKey: ScreenKey,
	bounds: MeasuredDimensions,
	styles: StyleProps = {},
	ancestorKeys?: ScreenKey[],
	expectedSourceScreenKey?: ScreenKey,
) {
	"worklet";
	registry.modify((state: any) => {
		"worklet";
		const stack = state[tag]?.linkStack;
		if (!stack || stack.length === 0) return state;

		let targetIndex = -1;

		// Prefer the most recent completed link where destination matches.
		// NOTE: matchesScreenKey is inlined here to avoid a Reanimated
		// workletization crash caused by nested worklet function calls
		// inside registry.modify callbacks.
		for (let i = stack.length - 1; i >= 0; i--) {
			const link = stack[i];
			const dest = link.destination;
			const destMatches =
				dest &&
				(dest.screenKey === screenKey ||
					(dest.ancestorKeys?.includes(screenKey) ?? false));
			if (destMatches) {
				targetIndex = i;
				break;
			}
		}

		// Fallback: find a link where destination is null (measure failed at mount)
		// but source exists — fill in the destination.
		if (targetIndex === -1) {
			for (let i = stack.length - 1; i >= 0; i--) {
				const link = stack[i];
				if (!link.source || link.destination !== null) continue;

				if (expectedSourceScreenKey) {
					const sourceMatches =
						link.source.screenKey === expectedSourceScreenKey ||
						(link.source.ancestorKeys?.includes(expectedSourceScreenKey) ??
							false);
					if (!sourceMatches) continue;
				}

				targetIndex = i;
				break;
			}
		}

		if (targetIndex !== -1) {
			stack[targetIndex].destination = {
				screenKey,
				ancestorKeys,
				bounds,
				styles,
			};
		}

		return state;
	});
}

/**
 * Clear all snapshots and links for a screen across all tags.
 * Called when a screen unmounts.
 */
function clear(screenKey: ScreenKey) {
	"worklet";
	registry.modify((state: any) => {
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

	const currentPresence = presence.value;
	let nextPresence: PresenceState | null = null;

	for (const tag in currentPresence) {
		const tagEntries = currentPresence[tag];
		if (!tagEntries[screenKey]) continue;

		if (!nextPresence) {
			nextPresence = { ...currentPresence };
		}

		const { [screenKey]: _removed, ...remainingForTag } = nextPresence[tag];
		if (Object.keys(remainingForTag).length === 0) {
			delete nextPresence[tag];
		} else {
			nextPresence[tag] = remainingForTag;
		}
	}

	if (nextPresence) {
		presence.value = nextPresence;
	}
}

export const BoundStore = {
	registerSnapshot,
	setLinkSource,
	setLinkDestination,
	updateLinkSource,
	updateLinkDestination,
	getActiveLink,
	registerBoundaryPresence,
	unregisterBoundaryPresence,
	hasBoundaryPresence,
	getBoundaryPresence,
	getBoundaryConfig,
	hasPendingLink,
	hasPendingLinkFromSource,
	getLatestPendingSourceScreenKey,
	hasSourceLink,
	hasDestinationLink,
	getSnapshot,
	resolveTransitionPair,
	setGroupActiveId,
	getGroupActiveId,
	clear,
	getGroups,
};
