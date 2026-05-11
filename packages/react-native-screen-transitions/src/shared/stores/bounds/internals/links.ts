import type { MeasuredDimensions, StyleProps } from "react-native-reanimated";
import {
	findLatestPendingSourceLinkIndex,
	findLinkIndexForDestinationWrite,
	hasLinkSide,
	isCompletedLinkForScreenKey,
	isSameScreenFamily,
	selectSourceUpdateTargetIndex,
} from "../helpers/link.helpers";
import { ensureTagState } from "../helpers/tag-state.helpers";
import type { ScreenKey, TagID, TagLink } from "../types";
import { type RegistryState, registry } from "./state";

type LinkSourceWriteMode = "capture" | "refresh";
type LinkDestinationWriteMode = "attach" | "refresh";

function setSource(
	mode: LinkSourceWriteMode,
	tag: TagID,
	screenKey: ScreenKey,
	bounds: MeasuredDimensions,
	styles: StyleProps = {},
) {
	"worklet";
	registry.modify(<T extends RegistryState>(state: T): T => {
		"worklet";
		const source = {
			screenKey,
			bounds,
			styles,
		};

		if (mode === "capture") {
			const tagState = ensureTagState(state, tag);
			const stack = tagState.linkStack;
			const topIndex = stack.length - 1;
			const topLink = topIndex >= 0 ? stack[topIndex] : null;

			if (
				topLink &&
				topLink.destination === null &&
				isSameScreenFamily(topLink.source, source)
			) {
				topLink.source = source;
				if (!topLink.initialSource) {
					topLink.initialSource = source;
				}
				return state;
			}

			stack.push({
				source,
				destination: null,
				initialSource: source,
			});

			return state;
		}

		const stack = state[tag]?.linkStack;
		if (!stack || stack.length === 0) return state;
		const targetIndex = selectSourceUpdateTargetIndex(stack, screenKey);
		if (targetIndex === -1) return state;

		const link = stack[targetIndex];

		link.source = source;
		if (!link.initialSource) {
			link.initialSource = source;
		}

		return state;
	});
}

function setDestination(
	mode: LinkDestinationWriteMode,
	tag: TagID,
	screenKey: ScreenKey,
	bounds: MeasuredDimensions,
	styles: StyleProps = {},
	expectedSourceScreenKey?: ScreenKey,
) {
	"worklet";
	registry.modify(<T extends RegistryState>(state: T): T => {
		"worklet";
		const stack = state[tag]?.linkStack;
		if (!stack || stack.length === 0) return state;

		const targetIndex = findLinkIndexForDestinationWrite(
			stack,
			mode === "refresh" ? screenKey : undefined,
			expectedSourceScreenKey,
		);

		if (targetIndex === -1) return state;

		const link = stack[targetIndex];
		const destination = {
			screenKey,
			bounds,
			styles,
		};

		link.destination = destination;
		if (!link.initialDestination) {
			link.initialDestination = destination;
		}

		return state;
	});
}

function getMatchedLink(tag: TagID, screenKey?: ScreenKey): TagLink | null {
	"worklet";
	const tagState = registry.get()[tag];
	const stack = tagState?.linkStack;
	if (!stack || stack.length === 0) {
		return null;
	}

	if (!screenKey) {
		const lastLink = stack[stack.length - 1];
		return lastLink ?? null;
	}

	for (let i = stack.length - 1; i >= 0; i--) {
		const link = stack[i];
		if (isCompletedLinkForScreenKey(link, screenKey)) {
			return link;
		}
	}

	return null;
}

function getPendingLink(
	tag: TagID,
	sourceScreenKey?: ScreenKey,
): TagLink | null {
	"worklet";
	const tagState = registry.get()[tag];
	const stack = tagState?.linkStack;
	if (!stack || stack.length === 0) return null;

	const pendingSourceLinkIndex = findLatestPendingSourceLinkIndex(
		stack,
		sourceScreenKey,
	);
	if (pendingSourceLinkIndex === -1) return null;
	return stack[pendingSourceLinkIndex] ?? null;
}

function hasSourceLink(tag: TagID, screenKey: ScreenKey): boolean {
	"worklet";
	return hasLinkSide(registry.get()[tag]?.linkStack, screenKey, "source");
}

function hasDestinationLink(tag: TagID, screenKey: ScreenKey): boolean {
	"worklet";
	return hasLinkSide(registry.get()[tag]?.linkStack, screenKey, "destination");
}

export {
	getMatchedLink,
	getPendingLink,
	hasDestinationLink,
	hasSourceLink,
	setDestination,
	setSource,
};
