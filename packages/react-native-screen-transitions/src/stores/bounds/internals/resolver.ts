import type {
	ResolvedTransitionPair,
	ResolveTransitionContext,
	TagID,
} from "../types";
import { getPairKeyForDestination, getResolvedLink } from "./links";

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
		sourceStyles: matchedLink?.source?.styles ?? null,
		destinationStyles: matchedLink?.destination?.styles ?? null,
		sourceScreenKey: matchedLink?.source?.screenKey ?? null,
		destinationScreenKey: matchedLink?.destination?.screenKey ?? null,
	};
}

export { resolveTransitionPair };
