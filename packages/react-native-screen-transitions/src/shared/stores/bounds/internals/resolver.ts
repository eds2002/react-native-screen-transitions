import { matchesScreenKey } from "../helpers/matching";
import type {
	ResolvedTransitionPair,
	ResolveTransitionContext,
	ScreenKey,
	TagID,
	TagLink,
	TagState,
} from "../types";
import { registry } from "./state";

const findLatestLink = (
	tagState: TagState,
	predicate: (link: TagLink) => boolean,
): TagLink | null => {
	"worklet";
	const stack = tagState.linkStack;
	for (let i = stack.length - 1; i >= 0; i--) {
		const link = stack[i];
		if (predicate(link)) {
			return link;
		}
	}
	return null;
};

function findCompletedLinkByDestination(
	tagState: TagState,
	screenKey?: ScreenKey,
): TagLink | null {
	"worklet";
	if (!screenKey) return null;

	return findLatestLink(
		tagState,
		(link) =>
			!!link.destination && matchesScreenKey(link.destination, screenKey),
	);
}

function findCompletedLinkBySource(
	tagState: TagState,
	screenKey?: ScreenKey,
): TagLink | null {
	"worklet";
	if (!screenKey) return null;

	return findLatestLink(
		tagState,
		(link) => !!link.destination && matchesScreenKey(link.source, screenKey),
	);
}

function findPendingLinkBySource(
	tagState: TagState,
	screenKey?: ScreenKey,
): TagLink | null {
	"worklet";
	if (!screenKey) return null;

	return findLatestLink(
		tagState,
		(link) =>
			link.destination === null && matchesScreenKey(link.source, screenKey),
	);
}

function resolveTransitionPair(
	tag: TagID,
	context: ResolveTransitionContext,
): ResolvedTransitionPair {
	"worklet";
	const tagState = registry.get()[tag];
	const stack = tagState?.linkStack;

	let matchedLink: TagLink | null = null;

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
			}
		}
	}

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
