import type { MeasuredDimensions, StyleProps } from "react-native-reanimated";
import {
	findLatestPendingSourceLinkIndex,
	findLinkIndexForDestinationWrite,
	hasLinkSide,
	isCompletedLinkForScreenKey,
	isSameScreenFamily,
	resolveLinkSnapshot,
	selectSourceUpdateTargetIndex,
} from "../helpers/link.helpers";
import { ensureTagState } from "../helpers/tag-state.helpers";
import type { NavigatorKey, ScreenKey, TagID, TagLink } from "../types";
import { type RegistryState, registry } from "./state";

type LinkSourceWriteMode = "capture" | "refresh";
type LinkDestinationWriteMode = "attach" | "refresh";

function setSource(
	mode: LinkSourceWriteMode,
	tag: TagID,
	screenKey: ScreenKey,
	bounds: MeasuredDimensions,
	styles: StyleProps = {},
	ancestorKeys?: ScreenKey[],
	navigatorKey?: NavigatorKey,
	ancestorNavigatorKeys?: NavigatorKey[],
) {
	"worklet";
	registry.modify(<T extends RegistryState>(state: T): T => {
		"worklet";
		const source = {
			screenKey,
			ancestorKeys,
			navigatorKey,
			ancestorNavigatorKeys,
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

				// Repeated capture can refresh a pending source before a
				// destination attaches; keep the first usable source for snapshots.
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

		// Refresh updates the live source, but initial snapshot reads should keep
		// returning the first captured source for this link.
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
	ancestorKeys?: ScreenKey[],
	expectedSourceScreenKey?: ScreenKey,
	navigatorKey?: NavigatorKey,
	ancestorNavigatorKeys?: NavigatorKey[],
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
			ancestorKeys,
			navigatorKey,
			ancestorNavigatorKeys,
			bounds,
			styles,
		};

		link.destination = destination;
		// Destination bounds can refresh as layout or scroll state settles; keep
		// the first usable destination for close-time delta calculations.
		if (!link.initialDestination) {
			link.initialDestination = destination;
		}

		return state;
	});
}

function getActiveLink(
	tag: TagID,
	screenKey?: ScreenKey,
	snapshot?: "initial",
): TagLink | null {
	"worklet";
	const tagState = registry.get()[tag];
	const stack = tagState?.linkStack;
	if (!stack || stack.length === 0) {
		return null;
	}

	if (!screenKey) {
		const lastLink = stack[stack.length - 1];
		return lastLink ? resolveLinkSnapshot(lastLink, snapshot) : null;
	}

	for (let i = stack.length - 1; i >= 0; i--) {
		const link = stack[i];
		if (isCompletedLinkForScreenKey(link, screenKey)) {
			return resolveLinkSnapshot(link, snapshot);
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
	getActiveLink,
	getPendingLink,
	hasDestinationLink,
	hasSourceLink,
	setDestination,
	setSource,
};
