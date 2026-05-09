import { findLatest } from "../helpers/find-latest";
import { matchesScreenKey } from "../helpers/matching";
import type {
	ResolvedTransitionPair,
	ResolveTransitionContext,
	ScreenKey,
	TagID,
	TagLink,
} from "../types";
import { registry } from "./state";

function findCompletedLinkByDestination(
	stack: TagLink[],
	screenKey?: ScreenKey,
): TagLink | null {
	"worklet";
	if (!screenKey) return null;

	return findLatest(
		stack,
		(link) =>
			!!link.destination && matchesScreenKey(link.destination, screenKey),
	);
}

function findCompletedLinkBySource(
	stack: TagLink[],
	screenKey?: ScreenKey,
): TagLink | null {
	"worklet";
	if (!screenKey) return null;

	return findLatest(
		stack,
		(link) => !!link.destination && matchesScreenKey(link.source, screenKey),
	);
}

function findPendingLinkBySource(
	stack: TagLink[],
	screenKey?: ScreenKey,
): TagLink | null {
	"worklet";
	if (!screenKey) return null;

	return findLatest(
		stack,
		(link) =>
			link.destination === null && matchesScreenKey(link.source, screenKey),
	);
}

function findEnteringTransitionLink(
	stack: TagLink[],
	context: ResolveTransitionContext,
): TagLink | null {
	"worklet";
	return (
		findCompletedLinkByDestination(stack, context.currentScreenKey) ??
		findPendingLinkBySource(stack, context.previousScreenKey) ??
		findCompletedLinkBySource(stack, context.previousScreenKey)
	);
}

function findExitingTransitionLink(
	stack: TagLink[],
	context: ResolveTransitionContext,
): TagLink | null {
	"worklet";
	return (
		findCompletedLinkBySource(stack, context.currentScreenKey) ??
		findCompletedLinkByDestination(stack, context.nextScreenKey) ??
		findPendingLinkBySource(stack, context.currentScreenKey)
	);
}

function resolveTransitionPair(
	tag: TagID,
	context: ResolveTransitionContext,
): ResolvedTransitionPair {
	"worklet";
	const tagState = registry.get()[tag];
	const stack = tagState?.linkStack;

	const matchedLink =
		stack && stack.length > 0
			? context.entering
				? findEnteringTransitionLink(stack, context)
				: findExitingTransitionLink(stack, context)
			: null;

	const sourceBounds = matchedLink?.source?.bounds ?? null;
	const destinationBounds = matchedLink?.destination?.bounds ?? null;
	const sourceStyles = matchedLink?.source?.styles ?? null;
	const destinationStyles = matchedLink?.destination?.styles ?? null;
	const sourceScreenKey = matchedLink?.source?.screenKey ?? null;
	const destinationScreenKey = matchedLink?.destination?.screenKey ?? null;

	return {
		sourceBounds,
		destinationBounds,
		sourceStyles,
		destinationStyles,
		sourceScreenKey,
		destinationScreenKey,
	};
}

export { resolveTransitionPair };
