import { createScreenPairKey } from "../helpers/link-pairs.helpers";
import type {
	ResolvedTransitionPair,
	ResolveTransitionContext,
	ScreenKey,
	ScreenPairKey,
	TagID,
} from "../types";
import { getMatchingSourceScreenKey } from "./entries";
import { getPairKeyForDestination, getResolvedLink } from "./links";

/**
 * The pair a transition frame's boundary `tag` belongs to: source screen -> destination screen,
 * wherever the two sit in the route tree. The destination is the entering screen (or, on the side
 * being covered, the screen above). The source is the screen that has the tag: the neighbour in this
 * stack when it does, else any screen with it (a card inside a nested stack, or a sibling stack,
 * opening a screen on another stack, whose neighbour is only the container).
 */
function resolveScreenPairKey(
	tag: TagID,
	context: {
		currentScreenKey?: ScreenKey;
		previousScreenKey?: ScreenKey;
		nextScreenKey?: ScreenKey;
	},
): ScreenPairKey | null {
	"worklet";
	const { currentScreenKey, previousScreenKey, nextScreenKey } = context;
	const entering = !nextScreenKey;
	const destinationScreenKey = entering ? currentScreenKey : nextScreenKey;
	const neighbourScreenKey = entering ? previousScreenKey : currentScreenKey;
	if (!destinationScreenKey) return null;
	const linked = getPairKeyForDestination(tag, destinationScreenKey);
	if (linked) return linked;
	const sourceScreenKey =
		getMatchingSourceScreenKey(tag, destinationScreenKey, neighbourScreenKey) ??
		neighbourScreenKey;
	return sourceScreenKey
		? createScreenPairKey(sourceScreenKey, destinationScreenKey)
		: null;
}

function resolveTransitionPair(
	tag: TagID,
	context: ResolveTransitionContext,
): ResolvedTransitionPair {
	"worklet";
	const destinationScreenKey = context.entering
		? context.currentScreenKey
		: context.nextScreenKey;
	const pairKey = destinationScreenKey
		? getPairKeyForDestination(tag, destinationScreenKey)
		: null;
	const matchedLink = pairKey ? getResolvedLink(pairKey, tag).link : null;

	return {
		sourceBounds: matchedLink?.source?.bounds ?? null,
		destinationBounds: matchedLink?.destination?.bounds ?? null,
		sourceScreenKey: matchedLink?.source?.screenKey ?? null,
		destinationScreenKey: matchedLink?.destination?.screenKey ?? null,
	};
}

export { resolveScreenPairKey, resolveTransitionPair };
