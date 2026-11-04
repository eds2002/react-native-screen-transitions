import type {
	NormalizedTransitionInterpolatedStyle,
	NormalizedTransitionSlotStyle,
} from "../../../../types/animation.types";
import type { LocalStyleLayers } from "./resolve-slot-styles";

const mergeBuckets = (
	frozen: Record<string, unknown> | undefined,
	live: Record<string, unknown> | undefined,
	composeTransforms: boolean,
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

		merged[key] = liveValue;
	}

	return merged;
};

const mergeSlots = (
	frozen: NormalizedTransitionSlotStyle | undefined,
	live: NormalizedTransitionSlotStyle,
): NormalizedTransitionSlotStyle => {
	"worklet";

	if (!frozen) {
		return live;
	}

	const merged: NormalizedTransitionSlotStyle = {};
	const style = mergeBuckets(
		frozen.style as Record<string, unknown> | undefined,
		live.style as Record<string, unknown> | undefined,
		true,
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
) => {
	"worklet";
	const composed: NormalizedTransitionInterpolatedStyle = { ...current };

	for (const slotId in next) {
		const nextSlot = next[slotId];

		if (nextSlot) {
			composed[slotId] = mergeSlots(current[slotId], nextSlot);
		}
	}

	return composed;
};

export const resolveInterpolatorStyleHandoff = ({
	currentOwnsInterpolator,
	currentStylesMap,
	nextStylesMap,
}: {
	currentOwnsInterpolator: boolean;
	currentStylesMap: NormalizedTransitionInterpolatedStyle | undefined;
	nextStylesMap: NormalizedTransitionInterpolatedStyle | undefined;
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
			composeCurrentAndNextStyles(currentStylesMap, nextStylesMap),
		],
	};
};
