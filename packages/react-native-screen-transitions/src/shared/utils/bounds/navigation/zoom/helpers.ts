import { interpolate } from "react-native-reanimated";
import { EPSILON } from "../../../../constants";
import type { BoundsLink } from "../../../../types/bounds.types";
import type {
	ActiveGesture,
	ResolvedPanGestureDirection,
} from "../../../../types/gesture.types";
import type { Layout } from "../../../../types/screen.types";
import type { BoundsOptions } from "../../types/options";
import {
	ZOOM_BACKGROUND_SCALE,
	ZOOM_DRAG_DIRECTIONAL_SCALE_EXPONENT,
	ZOOM_DRAG_DIRECTIONAL_SCALE_MAX,
	ZOOM_DRAG_DIRECTIONAL_SCALE_MIN,
	ZOOM_DRAG_TRANSLATION_EXPONENT,
	ZOOM_DRAG_TRANSLATION_NEGATIVE_MAX,
	ZOOM_DRAG_TRANSLATION_POSITIVE_MAX,
} from "./config";

export function getZoomContentTarget({
	explicitTarget,
	screenLayout,
	anchor,
	link,
}: {
	explicitTarget: BoundsOptions["target"] | undefined;
	screenLayout: Layout;
	anchor: BoundsOptions["anchor"] | undefined;
	link: BoundsLink;
}) {
	"worklet";

	if (explicitTarget) return explicitTarget;

	const sourceBounds = link.source?.bounds;
	const screenWidth = screenLayout.width;

	if (!sourceBounds || sourceBounds.width <= 0 || screenWidth <= 0) {
		return "fullscreen" as const;
	}

	const height = (sourceBounds.height / sourceBounds.width) * screenWidth;
	const verticalAnchor =
		anchor === "bottomLeading" ||
		anchor === "bottom" ||
		anchor === "bottomTrailing"
			? "bottom"
			: anchor === "center" || anchor === "leading" || anchor === "trailing"
				? "center"
				: "top";
	const y =
		verticalAnchor === "top"
			? 0
			: verticalAnchor === "bottom"
				? screenLayout.height - height
				: (screenLayout.height - height) / 2;

	return {
		x: 0,
		y,
		pageX: 0,
		pageY: y,
		width: screenWidth,
		height,
	};
}

export function resolveDragScaleTuple(
	value:
		| readonly [shrinkMin: number, growMax: number, exponent?: number]
		| undefined,
) {
	"worklet";

	return {
		shrinkMin: value?.[0] ?? ZOOM_DRAG_DIRECTIONAL_SCALE_MIN,
		growMax: value?.[1] ?? ZOOM_DRAG_DIRECTIONAL_SCALE_MAX,
		exponent: value?.[2] ?? ZOOM_DRAG_DIRECTIONAL_SCALE_EXPONENT,
	};
}

export function resolveDragTranslationTuple(
	value:
		| readonly [negativeMax: number, positiveMax: number, exponent?: number]
		| undefined,
) {
	"worklet";

	return {
		negativeMax: value?.[0] ?? ZOOM_DRAG_TRANSLATION_NEGATIVE_MAX,
		positiveMax: value?.[1] ?? ZOOM_DRAG_TRANSLATION_POSITIVE_MAX,
		exponent: value?.[2] ?? ZOOM_DRAG_TRANSLATION_EXPONENT,
	};
}

export function resolveBackgroundScale(value: number | undefined) {
	"worklet";

	return value ?? ZOOM_BACKGROUND_SCALE;
}

const isResolvedPanDirection = (
	direction: ActiveGesture | null | undefined,
): direction is ResolvedPanGestureDirection => {
	"worklet";
	return (
		direction === "horizontal" ||
		direction === "horizontal-inverted" ||
		direction === "vertical" ||
		direction === "vertical-inverted"
	);
};

const resolveMotionDirection = ({
	normX,
	normY,
	rawNormX,
	rawNormY,
}: {
	normX: number;
	normY: number;
	rawNormX: number;
	rawNormY: number;
}): ResolvedPanGestureDirection | null => {
	"worklet";
	const motionX = Math.max(Math.abs(normX), Math.abs(rawNormX));
	const motionY = Math.max(Math.abs(normY), Math.abs(rawNormY));

	if (motionX <= EPSILON && motionY <= EPSILON) {
		return null;
	}

	if (motionY > motionX + EPSILON) {
		return normY < 0 || rawNormY < 0 ? "vertical-inverted" : "vertical";
	}

	if (motionX > motionY + EPSILON) {
		return normX < 0 || rawNormX < 0 ? "horizontal-inverted" : "horizontal";
	}

	return null;
};

export function resolveZoomPanGestureDirection({
	active,
	direction,
	normX,
	normY,
	rawNormX,
	rawNormY,
}: {
	active: ActiveGesture | null | undefined;
	direction: ActiveGesture | null | undefined;
	normX: number;
	normY: number;
	rawNormX: number;
	rawNormY: number;
}): ResolvedPanGestureDirection | null {
	"worklet";
	const storedDirection = active ?? direction;
	const motionDirection = resolveMotionDirection({
		normX,
		normY,
		rawNormX,
		rawNormY,
	});

	if (!isResolvedPanDirection(storedDirection)) {
		return motionDirection;
	}

	if (!motionDirection) {
		return storedDirection;
	}

	const storedIsHorizontal =
		storedDirection === "horizontal" ||
		storedDirection === "horizontal-inverted";
	const storedMotion = storedIsHorizontal
		? Math.max(Math.abs(normX), Math.abs(rawNormX))
		: Math.max(Math.abs(normY), Math.abs(rawNormY));
	const oppositeMotion = storedIsHorizontal
		? Math.max(Math.abs(normY), Math.abs(rawNormY))
		: Math.max(Math.abs(normX), Math.abs(rawNormX));

	if (oppositeMotion > storedMotion + EPSILON) {
		return motionDirection;
	}

	return storedDirection;
}

export function interpolateOpacityRange(params: {
	progress: number;
	range: {
		inputStart: number;
		inputEnd: number;
		outputStart: number;
		outputEnd: number;
	};
}) {
	"worklet";

	const { progress, range } = params;

	return interpolate(
		progress,
		[range.inputStart, range.inputEnd],
		[range.outputStart, range.outputEnd],
		"clamp",
	);
}
