import { createScreenPairKey } from "../helpers/link-pairs.helpers";
import type {
	ResolvedTransitionPair,
	ResolveTransitionContext,
	ScreenPairKey,
	TagID,
} from "../types";
import { getResolvedLink } from "./links";

function resolvePairKey(
	context: ResolveTransitionContext,
): ScreenPairKey | null {
	"worklet";

	if (context.entering) {
		if (!context.previousScreenKey || !context.currentScreenKey) return null;
		return createScreenPairKey(
			context.previousScreenKey,
			context.currentScreenKey,
		);
	}

	if (!context.currentScreenKey || !context.nextScreenKey) return null;
	return createScreenPairKey(context.currentScreenKey, context.nextScreenKey);
}

function resolveTransitionPair(
	tag: TagID,
	context: ResolveTransitionContext,
): ResolvedTransitionPair {
	"worklet";
	const pairKey = resolvePairKey(context);
	const matchedLink = pairKey ? getResolvedLink(pairKey, tag).link : null;

	return {
		sourceBounds: matchedLink?.source.bounds ?? null,
		destinationBounds: matchedLink?.destination?.bounds ?? null,
		sourceStyles: matchedLink?.source.styles ?? null,
		destinationStyles: matchedLink?.destination?.styles ?? null,
		sourceScreenKey: matchedLink?.source.screenKey ?? null,
		destinationScreenKey: matchedLink?.destination?.screenKey ?? null,
	};
}

export { resolveTransitionPair };
