import type { MeasuredDimensions, StyleProps } from "react-native-reanimated";
import { collectIdentifierKeys } from "../helpers/keys";
import { matchesScreenKey } from "../helpers/matching";
import type {
	ScreenIdentifier,
	ScreenKey,
	Snapshot,
	TagID,
	TagLink,
	TagLinkIndex,
	TagState,
} from "../types";
import { debugStoreSizeLog, registry } from "./state";

const createEmptyLinkIndex = (): TagLinkIndex => ({
	latestPendingIndex: -1,
	pendingIndices: [],
	pendingBySourceKey: {},
	anyBySourceKey: {},
	completedBySourceKey: {},
	completedByDestinationKey: {},
});

const addIndexToBucket = (
	map: Record<string, number[]>,
	key: string,
	index: number,
) => {
	"worklet";
	const bucket = map[key];
	if (bucket) {
		bucket.push(index);
		return;
	}
	map[key] = [index];
};

const addIdentifierIndex = (
	map: Record<string, number[]>,
	identifier: ScreenIdentifier,
	index: number,
) => {
	"worklet";
	const keys = collectIdentifierKeys(identifier);
	for (let i = 0; i < keys.length; i++) {
		addIndexToBucket(map, keys[i], index);
	}
};

export const rebuildLinkIndexForTagState = (tagState: TagState) => {
	"worklet";
	const nextIndex = createEmptyLinkIndex();
	const stack = tagState.linkStack;

	for (let i = 0; i < stack.length; i++) {
		const link = stack[i];
		addIdentifierIndex(nextIndex.anyBySourceKey, link.source, i);

		if (link.destination === null) {
			nextIndex.pendingIndices.push(i);
			nextIndex.latestPendingIndex = i;
			addIdentifierIndex(nextIndex.pendingBySourceKey, link.source, i);
			continue;
		}

		addIdentifierIndex(nextIndex.completedBySourceKey, link.source, i);
		addIdentifierIndex(
			nextIndex.completedByDestinationKey,
			link.destination,
			i,
		);
	}

	tagState.linkIndex = nextIndex;
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
) {
	"worklet";
	registry.modify((state: any) => {
		"worklet";
		if (!state[tag]) {
			state[tag] = {
				snapshots: {},
				linkStack: [],
				linkIndex: {
					latestPendingIndex: -1,
					pendingIndices: [],
					pendingBySourceKey: {},
					anyBySourceKey: {},
					completedBySourceKey: {},
					completedByDestinationKey: {},
				},
			};
		}
		state[tag].snapshots[screenKey] = { bounds, styles, ancestorKeys };
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
) {
	"worklet";
	registry.modify((state: any) => {
		"worklet";
		if (!state[tag]) {
			state[tag] = {
				snapshots: {},
				linkStack: [],
				linkIndex: {
					latestPendingIndex: -1,
					pendingIndices: [],
					pendingBySourceKey: {},
					anyBySourceKey: {},
					completedBySourceKey: {},
					completedByDestinationKey: {},
				},
			};
		}

		const tagState = state[tag];
		const stack = tagState.linkStack;
		const linkIndex = tagState.linkIndex;
		const topIndex = stack.length - 1;
		const topLink = topIndex >= 0 ? stack[topIndex] : null;

		if (topLink && topLink.destination === null) {
			const topSource = topLink.source;
			const sameSource =
				topSource &&
				(topSource.screenKey === screenKey ||
					(topSource.ancestorKeys?.includes(screenKey) ?? false) ||
					(ancestorKeys?.includes(topSource.screenKey) ?? false));

			if (sameSource) {
				const oldSource = topLink.source;
				topLink.source = { screenKey, ancestorKeys, bounds, styles };

				const oldSeenAny: Record<string, true> = {};
				const oldAnyKey = oldSource.screenKey;
				oldSeenAny[oldAnyKey] = true;
				const oldAnyBucket = linkIndex.anyBySourceKey[oldAnyKey];
				if (oldAnyBucket) {
					for (let i = oldAnyBucket.length - 1; i >= 0; i--) {
						if (oldAnyBucket[i] === topIndex) {
							oldAnyBucket.splice(i, 1);
							break;
						}
					}
					if (oldAnyBucket.length === 0)
						delete linkIndex.anyBySourceKey[oldAnyKey];
				}
				const oldAncestors = oldSource.ancestorKeys;
				if (oldAncestors) {
					for (let i = 0; i < oldAncestors.length; i++) {
						const key = oldAncestors[i];
						if (oldSeenAny[key]) continue;
						oldSeenAny[key] = true;
						const bucket = linkIndex.anyBySourceKey[key];
						if (!bucket) continue;
						for (let j = bucket.length - 1; j >= 0; j--) {
							if (bucket[j] === topIndex) {
								bucket.splice(j, 1);
								break;
							}
						}
						if (bucket.length === 0) delete linkIndex.anyBySourceKey[key];
					}
				}

				const oldSeenPending: Record<string, true> = {};
				const oldPendingKey = oldSource.screenKey;
				oldSeenPending[oldPendingKey] = true;
				const oldPendingBucket = linkIndex.pendingBySourceKey[oldPendingKey];
				if (oldPendingBucket) {
					for (let i = oldPendingBucket.length - 1; i >= 0; i--) {
						if (oldPendingBucket[i] === topIndex) {
							oldPendingBucket.splice(i, 1);
							break;
						}
					}
					if (oldPendingBucket.length === 0) {
						delete linkIndex.pendingBySourceKey[oldPendingKey];
					}
				}
				if (oldAncestors) {
					for (let i = 0; i < oldAncestors.length; i++) {
						const key = oldAncestors[i];
						if (oldSeenPending[key]) continue;
						oldSeenPending[key] = true;
						const bucket = linkIndex.pendingBySourceKey[key];
						if (!bucket) continue;
						for (let j = bucket.length - 1; j >= 0; j--) {
							if (bucket[j] === topIndex) {
								bucket.splice(j, 1);
								break;
							}
						}
						if (bucket.length === 0) delete linkIndex.pendingBySourceKey[key];
					}
				}

				const newSeenAny: Record<string, true> = {};
				const newAnyKey = screenKey;
				newSeenAny[newAnyKey] = true;
				if (linkIndex.anyBySourceKey[newAnyKey]) {
					linkIndex.anyBySourceKey[newAnyKey].push(topIndex);
				} else {
					linkIndex.anyBySourceKey[newAnyKey] = [topIndex];
				}
				if (ancestorKeys) {
					for (let i = 0; i < ancestorKeys.length; i++) {
						const key = ancestorKeys[i];
						if (newSeenAny[key]) continue;
						newSeenAny[key] = true;
						if (linkIndex.anyBySourceKey[key]) {
							linkIndex.anyBySourceKey[key].push(topIndex);
						} else {
							linkIndex.anyBySourceKey[key] = [topIndex];
						}
					}
				}

				const newSeenPending: Record<string, true> = {};
				const newPendingKey = screenKey;
				newSeenPending[newPendingKey] = true;
				if (linkIndex.pendingBySourceKey[newPendingKey]) {
					linkIndex.pendingBySourceKey[newPendingKey].push(topIndex);
				} else {
					linkIndex.pendingBySourceKey[newPendingKey] = [topIndex];
				}
				if (ancestorKeys) {
					for (let i = 0; i < ancestorKeys.length; i++) {
						const key = ancestorKeys[i];
						if (newSeenPending[key]) continue;
						newSeenPending[key] = true;
						if (linkIndex.pendingBySourceKey[key]) {
							linkIndex.pendingBySourceKey[key].push(topIndex);
						} else {
							linkIndex.pendingBySourceKey[key] = [topIndex];
						}
					}
				}

				linkIndex.latestPendingIndex = topIndex;
				return state;
			}
		}

		const newIndex = stack.length;
		stack.push({
			source: { screenKey, ancestorKeys, bounds, styles },
			destination: null,
		});

		linkIndex.pendingIndices.push(newIndex);
		linkIndex.latestPendingIndex = newIndex;

		const anySeen: Record<string, true> = {};
		anySeen[screenKey] = true;
		if (linkIndex.anyBySourceKey[screenKey]) {
			linkIndex.anyBySourceKey[screenKey].push(newIndex);
		} else {
			linkIndex.anyBySourceKey[screenKey] = [newIndex];
		}
		if (ancestorKeys) {
			for (let i = 0; i < ancestorKeys.length; i++) {
				const key = ancestorKeys[i];
				if (anySeen[key]) continue;
				anySeen[key] = true;
				if (linkIndex.anyBySourceKey[key]) {
					linkIndex.anyBySourceKey[key].push(newIndex);
				} else {
					linkIndex.anyBySourceKey[key] = [newIndex];
				}
			}
		}

		const pendingSeen: Record<string, true> = {};
		pendingSeen[screenKey] = true;
		if (linkIndex.pendingBySourceKey[screenKey]) {
			linkIndex.pendingBySourceKey[screenKey].push(newIndex);
		} else {
			linkIndex.pendingBySourceKey[screenKey] = [newIndex];
		}
		if (ancestorKeys) {
			for (let i = 0; i < ancestorKeys.length; i++) {
				const key = ancestorKeys[i];
				if (pendingSeen[key]) continue;
				pendingSeen[key] = true;
				if (linkIndex.pendingBySourceKey[key]) {
					linkIndex.pendingBySourceKey[key].push(newIndex);
				} else {
					linkIndex.pendingBySourceKey[key] = [newIndex];
				}
			}
		}

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
) {
	"worklet";
	registry.modify((state: any) => {
		"worklet";
		const tagState = state[tag];
		const stack = tagState?.linkStack;
		if (!stack || stack.length === 0) return state;

		let targetIndex = -1;

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

		if (targetIndex === -1) {
			return state;
		}

		const targetLink = stack[targetIndex];
		const linkIndex = tagState.linkIndex;
		const oldSource = targetLink.source;
		const hasDestination = targetLink.destination !== null;

		targetLink.source = { screenKey, ancestorKeys, bounds, styles };

		const oldAnySeen: Record<string, true> = {};
		const oldAnyKey = oldSource.screenKey;
		oldAnySeen[oldAnyKey] = true;
		const oldAnyBucket = linkIndex.anyBySourceKey[oldAnyKey];
		if (oldAnyBucket) {
			for (let i = oldAnyBucket.length - 1; i >= 0; i--) {
				if (oldAnyBucket[i] === targetIndex) {
					oldAnyBucket.splice(i, 1);
					break;
				}
			}
			if (oldAnyBucket.length === 0) delete linkIndex.anyBySourceKey[oldAnyKey];
		}
		if (oldSource.ancestorKeys) {
			for (let i = 0; i < oldSource.ancestorKeys.length; i++) {
				const key = oldSource.ancestorKeys[i];
				if (oldAnySeen[key]) continue;
				oldAnySeen[key] = true;
				const bucket = linkIndex.anyBySourceKey[key];
				if (!bucket) continue;
				for (let j = bucket.length - 1; j >= 0; j--) {
					if (bucket[j] === targetIndex) {
						bucket.splice(j, 1);
						break;
					}
				}
				if (bucket.length === 0) delete linkIndex.anyBySourceKey[key];
			}
		}

		if (hasDestination) {
			const oldCompletedSeen: Record<string, true> = {};
			const oldCompletedKey = oldSource.screenKey;
			oldCompletedSeen[oldCompletedKey] = true;
			const oldCompletedBucket =
				linkIndex.completedBySourceKey[oldCompletedKey];
			if (oldCompletedBucket) {
				for (let i = oldCompletedBucket.length - 1; i >= 0; i--) {
					if (oldCompletedBucket[i] === targetIndex) {
						oldCompletedBucket.splice(i, 1);
						break;
					}
				}
				if (oldCompletedBucket.length === 0) {
					delete linkIndex.completedBySourceKey[oldCompletedKey];
				}
			}
			if (oldSource.ancestorKeys) {
				for (let i = 0; i < oldSource.ancestorKeys.length; i++) {
					const key = oldSource.ancestorKeys[i];
					if (oldCompletedSeen[key]) continue;
					oldCompletedSeen[key] = true;
					const bucket = linkIndex.completedBySourceKey[key];
					if (!bucket) continue;
					for (let j = bucket.length - 1; j >= 0; j--) {
						if (bucket[j] === targetIndex) {
							bucket.splice(j, 1);
							break;
						}
					}
					if (bucket.length === 0) delete linkIndex.completedBySourceKey[key];
				}
			}
		} else {
			const oldPendingSeen: Record<string, true> = {};
			const oldPendingKey = oldSource.screenKey;
			oldPendingSeen[oldPendingKey] = true;
			const oldPendingBucket = linkIndex.pendingBySourceKey[oldPendingKey];
			if (oldPendingBucket) {
				for (let i = oldPendingBucket.length - 1; i >= 0; i--) {
					if (oldPendingBucket[i] === targetIndex) {
						oldPendingBucket.splice(i, 1);
						break;
					}
				}
				if (oldPendingBucket.length === 0) {
					delete linkIndex.pendingBySourceKey[oldPendingKey];
				}
			}
			if (oldSource.ancestorKeys) {
				for (let i = 0; i < oldSource.ancestorKeys.length; i++) {
					const key = oldSource.ancestorKeys[i];
					if (oldPendingSeen[key]) continue;
					oldPendingSeen[key] = true;
					const bucket = linkIndex.pendingBySourceKey[key];
					if (!bucket) continue;
					for (let j = bucket.length - 1; j >= 0; j--) {
						if (bucket[j] === targetIndex) {
							bucket.splice(j, 1);
							break;
						}
					}
					if (bucket.length === 0) delete linkIndex.pendingBySourceKey[key];
				}
			}
		}

		const newAnySeen: Record<string, true> = {};
		newAnySeen[screenKey] = true;
		if (linkIndex.anyBySourceKey[screenKey]) {
			linkIndex.anyBySourceKey[screenKey].push(targetIndex);
		} else {
			linkIndex.anyBySourceKey[screenKey] = [targetIndex];
		}
		if (ancestorKeys) {
			for (let i = 0; i < ancestorKeys.length; i++) {
				const key = ancestorKeys[i];
				if (newAnySeen[key]) continue;
				newAnySeen[key] = true;
				if (linkIndex.anyBySourceKey[key]) {
					linkIndex.anyBySourceKey[key].push(targetIndex);
				} else {
					linkIndex.anyBySourceKey[key] = [targetIndex];
				}
			}
		}

		if (hasDestination) {
			const newCompletedSeen: Record<string, true> = {};
			newCompletedSeen[screenKey] = true;
			if (linkIndex.completedBySourceKey[screenKey]) {
				linkIndex.completedBySourceKey[screenKey].push(targetIndex);
			} else {
				linkIndex.completedBySourceKey[screenKey] = [targetIndex];
			}
			if (ancestorKeys) {
				for (let i = 0; i < ancestorKeys.length; i++) {
					const key = ancestorKeys[i];
					if (newCompletedSeen[key]) continue;
					newCompletedSeen[key] = true;
					if (linkIndex.completedBySourceKey[key]) {
						linkIndex.completedBySourceKey[key].push(targetIndex);
					} else {
						linkIndex.completedBySourceKey[key] = [targetIndex];
					}
				}
			}
		} else {
			const newPendingSeen: Record<string, true> = {};
			newPendingSeen[screenKey] = true;
			if (linkIndex.pendingBySourceKey[screenKey]) {
				linkIndex.pendingBySourceKey[screenKey].push(targetIndex);
			} else {
				linkIndex.pendingBySourceKey[screenKey] = [targetIndex];
			}
			if (ancestorKeys) {
				for (let i = 0; i < ancestorKeys.length; i++) {
					const key = ancestorKeys[i];
					if (newPendingSeen[key]) continue;
					newPendingSeen[key] = true;
					if (linkIndex.pendingBySourceKey[key]) {
						linkIndex.pendingBySourceKey[key].push(targetIndex);
					} else {
						linkIndex.pendingBySourceKey[key] = [targetIndex];
					}
				}
			}
		}

		return state;
	});
	debugStoreSizeLog(`updateLinkSource(${tag},${screenKey})`);
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
		const tagState = state[tag];
		const stack = tagState?.linkStack;
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

			if (targetIndex === -1) {
				return state;
			}
		} else {
			for (let i = stack.length - 1; i >= 0; i--) {
				if (stack[i].destination === null) {
					targetIndex = i;
					break;
				}
			}
		}

		if (targetIndex === -1) {
			return state;
		}

		const targetLink = stack[targetIndex];
		if (targetLink.destination !== null) {
			return state;
		}

		targetLink.destination = {
			screenKey,
			ancestorKeys,
			bounds,
			styles,
		};

		const linkIndex = tagState.linkIndex;

		for (let i = linkIndex.pendingIndices.length - 1; i >= 0; i--) {
			if (linkIndex.pendingIndices[i] === targetIndex) {
				linkIndex.pendingIndices.splice(i, 1);
				break;
			}
		}
		if (linkIndex.latestPendingIndex === targetIndex) {
			linkIndex.latestPendingIndex =
				linkIndex.pendingIndices.length > 0
					? linkIndex.pendingIndices[linkIndex.pendingIndices.length - 1]
					: -1;
		}

		const src = targetLink.source;
		const srcSeen: Record<string, true> = {};
		srcSeen[src.screenKey] = true;
		const sourceBucket = linkIndex.pendingBySourceKey[src.screenKey];
		if (sourceBucket) {
			for (let i = sourceBucket.length - 1; i >= 0; i--) {
				if (sourceBucket[i] === targetIndex) {
					sourceBucket.splice(i, 1);
					break;
				}
			}
			if (sourceBucket.length === 0)
				delete linkIndex.pendingBySourceKey[src.screenKey];
		}
		if (src.ancestorKeys) {
			for (let i = 0; i < src.ancestorKeys.length; i++) {
				const key = src.ancestorKeys[i];
				if (srcSeen[key]) continue;
				srcSeen[key] = true;
				const bucket = linkIndex.pendingBySourceKey[key];
				if (!bucket) continue;
				for (let j = bucket.length - 1; j >= 0; j--) {
					if (bucket[j] === targetIndex) {
						bucket.splice(j, 1);
						break;
					}
				}
				if (bucket.length === 0) delete linkIndex.pendingBySourceKey[key];
			}
		}

		const completedSourceSeen: Record<string, true> = {};
		completedSourceSeen[src.screenKey] = true;
		if (linkIndex.completedBySourceKey[src.screenKey]) {
			linkIndex.completedBySourceKey[src.screenKey].push(targetIndex);
		} else {
			linkIndex.completedBySourceKey[src.screenKey] = [targetIndex];
		}
		if (src.ancestorKeys) {
			for (let i = 0; i < src.ancestorKeys.length; i++) {
				const key = src.ancestorKeys[i];
				if (completedSourceSeen[key]) continue;
				completedSourceSeen[key] = true;
				if (linkIndex.completedBySourceKey[key]) {
					linkIndex.completedBySourceKey[key].push(targetIndex);
				} else {
					linkIndex.completedBySourceKey[key] = [targetIndex];
				}
			}
		}

		const destSeen: Record<string, true> = {};
		destSeen[screenKey] = true;
		if (linkIndex.completedByDestinationKey[screenKey]) {
			linkIndex.completedByDestinationKey[screenKey].push(targetIndex);
		} else {
			linkIndex.completedByDestinationKey[screenKey] = [targetIndex];
		}
		if (ancestorKeys) {
			for (let i = 0; i < ancestorKeys.length; i++) {
				const key = ancestorKeys[i];
				if (destSeen[key]) continue;
				destSeen[key] = true;
				if (linkIndex.completedByDestinationKey[key]) {
					linkIndex.completedByDestinationKey[key].push(targetIndex);
				} else {
					linkIndex.completedByDestinationKey[key] = [targetIndex];
				}
			}
		}

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
) {
	"worklet";
	registry.modify((state: any) => {
		"worklet";
		const tagState = state[tag];
		const stack = tagState?.linkStack;
		if (!stack || stack.length === 0) return state;

		let targetIndex = -1;

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

		if (targetIndex === -1) {
			return state;
		}

		const targetLink = stack[targetIndex];
		const previousDestination = targetLink.destination;
		targetLink.destination = {
			screenKey,
			ancestorKeys,
			bounds,
			styles,
		};

		const linkIndex = tagState.linkIndex;

		if (previousDestination !== null) {
			const oldDestSeen: Record<string, true> = {};
			oldDestSeen[previousDestination.screenKey] = true;
			const oldBucket =
				linkIndex.completedByDestinationKey[previousDestination.screenKey];
			if (oldBucket) {
				for (let i = oldBucket.length - 1; i >= 0; i--) {
					if (oldBucket[i] === targetIndex) {
						oldBucket.splice(i, 1);
						break;
					}
				}
				if (oldBucket.length === 0) {
					delete linkIndex.completedByDestinationKey[
						previousDestination.screenKey
					];
				}
			}
			if (previousDestination.ancestorKeys) {
				for (let i = 0; i < previousDestination.ancestorKeys.length; i++) {
					const key = previousDestination.ancestorKeys[i];
					if (oldDestSeen[key]) continue;
					oldDestSeen[key] = true;
					const bucket = linkIndex.completedByDestinationKey[key];
					if (!bucket) continue;
					for (let j = bucket.length - 1; j >= 0; j--) {
						if (bucket[j] === targetIndex) {
							bucket.splice(j, 1);
							break;
						}
					}
					if (bucket.length === 0) {
						delete linkIndex.completedByDestinationKey[key];
					}
				}
			}
		} else {
			for (let i = linkIndex.pendingIndices.length - 1; i >= 0; i--) {
				if (linkIndex.pendingIndices[i] === targetIndex) {
					linkIndex.pendingIndices.splice(i, 1);
					break;
				}
			}
			if (linkIndex.latestPendingIndex === targetIndex) {
				linkIndex.latestPendingIndex =
					linkIndex.pendingIndices.length > 0
						? linkIndex.pendingIndices[linkIndex.pendingIndices.length - 1]
						: -1;
			}

			const src = targetLink.source;
			const srcSeen: Record<string, true> = {};
			srcSeen[src.screenKey] = true;
			const pendingBucket = linkIndex.pendingBySourceKey[src.screenKey];
			if (pendingBucket) {
				for (let i = pendingBucket.length - 1; i >= 0; i--) {
					if (pendingBucket[i] === targetIndex) {
						pendingBucket.splice(i, 1);
						break;
					}
				}
				if (pendingBucket.length === 0) {
					delete linkIndex.pendingBySourceKey[src.screenKey];
				}
			}
			if (src.ancestorKeys) {
				for (let i = 0; i < src.ancestorKeys.length; i++) {
					const key = src.ancestorKeys[i];
					if (srcSeen[key]) continue;
					srcSeen[key] = true;
					const bucket = linkIndex.pendingBySourceKey[key];
					if (!bucket) continue;
					for (let j = bucket.length - 1; j >= 0; j--) {
						if (bucket[j] === targetIndex) {
							bucket.splice(j, 1);
							break;
						}
					}
					if (bucket.length === 0) delete linkIndex.pendingBySourceKey[key];
				}
			}

			const completedSrcSeen: Record<string, true> = {};
			completedSrcSeen[src.screenKey] = true;
			if (linkIndex.completedBySourceKey[src.screenKey]) {
				linkIndex.completedBySourceKey[src.screenKey].push(targetIndex);
			} else {
				linkIndex.completedBySourceKey[src.screenKey] = [targetIndex];
			}
			if (src.ancestorKeys) {
				for (let i = 0; i < src.ancestorKeys.length; i++) {
					const key = src.ancestorKeys[i];
					if (completedSrcSeen[key]) continue;
					completedSrcSeen[key] = true;
					if (linkIndex.completedBySourceKey[key]) {
						linkIndex.completedBySourceKey[key].push(targetIndex);
					} else {
						linkIndex.completedBySourceKey[key] = [targetIndex];
					}
				}
			}
		}

		const nextDestSeen: Record<string, true> = {};
		nextDestSeen[screenKey] = true;
		if (linkIndex.completedByDestinationKey[screenKey]) {
			linkIndex.completedByDestinationKey[screenKey].push(targetIndex);
		} else {
			linkIndex.completedByDestinationKey[screenKey] = [targetIndex];
		}
		if (ancestorKeys) {
			for (let i = 0; i < ancestorKeys.length; i++) {
				const key = ancestorKeys[i];
				if (nextDestSeen[key]) continue;
				nextDestSeen[key] = true;
				if (linkIndex.completedByDestinationKey[key]) {
					linkIndex.completedByDestinationKey[key].push(targetIndex);
				} else {
					linkIndex.completedByDestinationKey[key] = [targetIndex];
				}
			}
		}

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

	const linkIndex = tagState.linkIndex;
	const sourceBucket = linkIndex.completedBySourceKey[screenKey] ?? [];
	const destinationBucket =
		linkIndex.completedByDestinationKey[screenKey] ?? [];

	let sourcePtr = sourceBucket.length - 1;
	let destinationPtr = destinationBucket.length - 1;

	while (sourcePtr >= 0 || destinationPtr >= 0) {
		const sourceIndex = sourcePtr >= 0 ? sourceBucket[sourcePtr] : -1;
		const destinationIndex =
			destinationPtr >= 0 ? destinationBucket[destinationPtr] : -1;

		let nextIndex = -1;
		if (sourceIndex >= destinationIndex) {
			nextIndex = sourceIndex;
			sourcePtr -= 1;
		} else {
			nextIndex = destinationIndex;
			destinationPtr -= 1;
		}

		if (nextIndex < 0 || nextIndex >= stack.length) continue;
		const link = stack[nextIndex];
		if (!link.destination) continue;

		if (
			matchesScreenKey(link.source, screenKey) ||
			matchesScreenKey(link.destination, screenKey)
		) {
			return link;
		}
	}

	for (let i = stack.length - 1; i >= 0; i--) {
		const link = stack[i];
		if (!link.destination) continue;
		const isSource = matchesScreenKey(link.source, screenKey);
		const isDestination = matchesScreenKey(link.destination, screenKey);
		if (isSource || isDestination) {
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

	const pendingIndices = tagState.linkIndex.pendingIndices;
	for (let i = pendingIndices.length - 1; i >= 0; i--) {
		const index = pendingIndices[i];
		if (
			index >= 0 &&
			index < stack.length &&
			stack[index].destination === null
		) {
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

	const sourceBucket =
		tagState.linkIndex.pendingBySourceKey[sourceScreenKey] ?? [];
	for (let i = sourceBucket.length - 1; i >= 0; i--) {
		const index = sourceBucket[i];
		if (index < 0 || index >= stack.length) continue;
		const link = stack[index];
		if (link.destination !== null) continue;
		if (matchesScreenKey(link.source, sourceScreenKey)) return true;
	}

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

	const latestPendingIndex = tagState.linkIndex.latestPendingIndex;
	if (
		latestPendingIndex >= 0 &&
		latestPendingIndex < stack.length &&
		stack[latestPendingIndex].destination === null
	) {
		return stack[latestPendingIndex].source.screenKey;
	}

	const pendingIndices = tagState.linkIndex.pendingIndices;
	for (let i = pendingIndices.length - 1; i >= 0; i--) {
		const index = pendingIndices[i];
		if (index < 0 || index >= stack.length) continue;
		const link = stack[index];
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

	const bucket = tagState.linkIndex.anyBySourceKey[screenKey] ?? [];
	for (let i = bucket.length - 1; i >= 0; i--) {
		const index = bucket[i];
		if (index < 0 || index >= stack.length) continue;
		if (matchesScreenKey(stack[index].source, screenKey)) return true;
	}

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

	const bucket = tagState.linkIndex.completedByDestinationKey[screenKey] ?? [];
	for (let i = bucket.length - 1; i >= 0; i--) {
		const index = bucket[i];
		if (index < 0 || index >= stack.length) continue;
		const link = stack[index];
		if (!link.destination) continue;
		if (matchesScreenKey(link.destination, screenKey)) return true;
	}

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
