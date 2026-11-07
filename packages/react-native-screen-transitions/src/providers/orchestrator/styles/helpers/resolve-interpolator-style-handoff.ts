import type {
	NormalizedTransitionInterpolatedStyle,
	NormalizedTransitionSlotStyle,
} from "../../../../types/animation.types";
import { getBoundsScreenFrame } from "../../../../utils/bounds/helpers/styles/screen-frame";
import type { LocalStyleLayers } from "./resolve-slot-styles";

const mergeBuckets = (
	frozen: Record<string, unknown> | undefined,
	live: Record<string, unknown> | undefined,
	composeTransforms: boolean,
	multiplyOpacity = false,
) => {
	"worklet";

	if (!frozen) {
		return live;
	}

	if (!live) {
		return frozen;
	}

	const merged: Record<string, unknown> = { ...frozen };

	for (const key in live) {
		const liveValue = live[key];

		if (liveValue === undefined || liveValue === null) {
			continue;
		}

		const frozenValue = frozen[key];

		if (
			composeTransforms &&
			key === "transform" &&
			Array.isArray(frozenValue) &&
			Array.isArray(liveValue)
		) {
			merged[key] = [...frozenValue, ...liveValue];
			continue;
		}

		// Closing under a screen that still closes above it, this screen fades out itself (its own
		// opacity) inside the cover the next screen adds: the two nest like the transforms.
		if (
			multiplyOpacity &&
			key === "opacity" &&
			typeof frozenValue === "number" &&
			typeof liveValue === "number"
		) {
			merged[key] = frozenValue * liveValue;
			continue;
		}

		merged[key] = liveValue;
	}

	return merged;
};

const mergeSlots = (
	frozen: NormalizedTransitionSlotStyle | undefined,
	live: NormalizedTransitionSlotStyle,
	multiplyOpacity: boolean,
): NormalizedTransitionSlotStyle => {
	"worklet";

	// A bounds element the next screen places (bounds().styles()) is placed whole: its path already
	// starts wherever the element is drawn (in flight in this screen's own pair, a chain). Composing
	// this screen's own bounds transform onto it would move it twice.
	const liveFrame = getBoundsScreenFrame(live.style);
	// The next screen's pair has landed (it is closing, its element all but home) and this screen is
	// in a pair of its own (closing too, popped as the one above lands): this screen's own pair
	// carries the element now.
	if (frozen && liveFrame?.pairLanded && getBoundsScreenFrame(frozen.style)) {
		return frozen;
	}
	if (!frozen || liveFrame) {
		return live;
	}

	const merged: NormalizedTransitionSlotStyle = {};
	const style = mergeBuckets(
		frozen.style as Record<string, unknown> | undefined,
		live.style as Record<string, unknown> | undefined,
		true,
		multiplyOpacity,
	);

	if (style) {
		merged.style = style;
	}

	if (frozen.props || live.props) {
		merged.props = mergeBuckets(frozen.props, live.props, false);
	}

	const boundsLocalTransform =
		live.boundsLocalTransform ?? frozen.boundsLocalTransform;

	if (boundsLocalTransform) {
		merged.boundsLocalTransform = boundsLocalTransform;
	}

	return merged;
};

const composeCurrentAndNextStyles = (
	current: NormalizedTransitionInterpolatedStyle,
	next: NormalizedTransitionInterpolatedStyle,
	multiplyOpacity: boolean,
) => {
	"worklet";
	const composed: NormalizedTransitionInterpolatedStyle = { ...current };

	for (const slotId in next) {
		const nextSlot = next[slotId];

		if (nextSlot) {
			composed[slotId] = mergeSlots(current[slotId], nextSlot, multiplyOpacity);
		}
	}

	return composed;
};

export const resolveInterpolatorStyleHandoff = ({
	currentOwnsInterpolator,
	currentStylesMap,
	nextStylesMap,
	currentClosing = false,
}: {
	currentOwnsInterpolator: boolean;
	currentStylesMap: NormalizedTransitionInterpolatedStyle | undefined;
	nextStylesMap: NormalizedTransitionInterpolatedStyle | undefined;
	/** This screen is closing itself (under a screen still closing above it). */
	currentClosing?: boolean;
}): {
	localStylesMaps: LocalStyleLayers;
} => {
	"worklet";

	if (currentOwnsInterpolator) {
		return {
			localStylesMaps: currentStylesMap ? [currentStylesMap] : [],
		};
	}

	if (!nextStylesMap) {
		return {
			localStylesMaps: currentStylesMap ? [currentStylesMap] : [],
		};
	}

	if (!currentStylesMap) {
		return {
			localStylesMaps: [nextStylesMap],
		};
	}

	return {
		localStylesMaps: [
			composeCurrentAndNextStyles(
				currentStylesMap,
				nextStylesMap,
				currentClosing,
			),
		],
	};
};
