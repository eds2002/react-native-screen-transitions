import { matchesScreenKey } from "../helpers/matching";
import type {
	ResolvedTransitionPair,
	ResolveTransitionContext,
	ScreenKey,
	TagID,
	TagLink,
	TagState,
} from "../types";
import { getSnapshot } from "./registry";
import { debugResolverLog, registry } from "./state";

function findCompletedLinkByDestination(
	tagState: TagState,
	screenKey?: ScreenKey,
): TagLink | null {
	"worklet";
	if (!screenKey) return null;

	const stack = tagState.linkStack;
	const bucket = tagState.linkIndex.completedByDestinationKey[screenKey] ?? [];
	for (let i = bucket.length - 1; i >= 0; i--) {
		const index = bucket[i];
		if (index < 0 || index >= stack.length) continue;
		const link = stack[index];
		if (!link.destination) continue;
		if (matchesScreenKey(link.destination, screenKey)) {
			return link;
		}
	}

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
	tagState: TagState,
	screenKey?: ScreenKey,
): TagLink | null {
	"worklet";
	if (!screenKey) return null;

	const stack = tagState.linkStack;
	const bucket = tagState.linkIndex.completedBySourceKey[screenKey] ?? [];
	for (let i = bucket.length - 1; i >= 0; i--) {
		const index = bucket[i];
		if (index < 0 || index >= stack.length) continue;
		const link = stack[index];
		if (!link.destination) continue;
		if (matchesScreenKey(link.source, screenKey)) {
			return link;
		}
	}

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
	tagState: TagState,
	screenKey?: ScreenKey,
): TagLink | null {
	"worklet";
	if (!screenKey) return null;

	const stack = tagState.linkStack;
	const bucket = tagState.linkIndex.pendingBySourceKey[screenKey] ?? [];
	for (let i = bucket.length - 1; i >= 0; i--) {
		const index = bucket[i];
		if (index < 0 || index >= stack.length) continue;
		const link = stack[index];
		if (link.destination !== null) continue;
		if (matchesScreenKey(link.source, screenKey)) {
			return link;
		}
	}

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
): { bounds: any; screenKey: ScreenKey } | null {
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
	const tagState = registry.value[tag];
	const stack = tagState?.linkStack;

	let matchedLink: TagLink | null = null;
	let usedPending = false;

	if (tagState && stack && stack.length > 0) {
		if (context.entering) {
			matchedLink = findCompletedLinkByDestination(
				tagState,
				context.currentScreenKey,
			);

			if (!matchedLink) {
				matchedLink = findPendingLinkBySource(
					tagState,
					context.previousScreenKey,
				);
				usedPending = !!matchedLink;
			}

			if (!matchedLink) {
				matchedLink = findCompletedLinkBySource(
					tagState,
					context.previousScreenKey,
				);
			}

			if (!matchedLink) {
				matchedLink = findCompletedLinkByDestination(
					tagState,
					context.nextScreenKey,
				);
			}
		} else {
			matchedLink = findCompletedLinkBySource(
				tagState,
				context.currentScreenKey,
			);

			if (!matchedLink) {
				matchedLink = findCompletedLinkByDestination(
					tagState,
					context.nextScreenKey,
				);
			}

			if (!matchedLink) {
				matchedLink = findPendingLinkBySource(
					tagState,
					context.currentScreenKey,
				);
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

export { resolveTransitionPair };
