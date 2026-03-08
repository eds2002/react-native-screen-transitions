import { interpolate, type StyleProps } from "react-native-reanimated";
import {
	EPSILON,
	NAVIGATION_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_STYLE_ID,
	NO_STYLES,
} from "../../../constants";
import {
	BoundStore,
	type ResolvedTransitionPair,
} from "../../../stores/bounds";
import type { TransitionInterpolatedStyle } from "../../../types/animation.types";
import type { BoundsNavigationZoomOptions } from "../../../types/bounds.types";
import type { Layout } from "../../../types/screen.types";
import type { BoundsOptions } from "../types/options";
import {
	type ResolvedZoomOptions,
	resolveZoomConfig,
	toNumber,
} from "./config";
import type { BuildZoomStylesParams } from "./types";

type CombinedScaleMode = "multiply" | "average" | "max" | "min";

const IDENTITY_DRAG_SCALE_OUTPUT = [1, 1] as const;
type ZoomMask = NonNullable<BoundsNavigationZoomOptions["mask"]>;
type ZoomRadiusValue = Exclude<ZoomMask["borderRadius"], undefined>;

const clamp = (value: number, min: number, max: number): number => {
	"worklet";
	const lower = min < max ? min : max;
	const upper = max > min ? max : min;

	if (value < lower) return lower;
	if (value > upper) return upper;

	return value;
};

const clamp01 = (value: number): number => {
	"worklet";
	return clamp(value, 0, 1);
};

const lerp = (from: number, to: number, t: number): number => {
	"worklet";
	return from + (to - from) * t;
};

const safeDivide = (
	numerator: number,
	denominator: number,
	fallback = 0,
): number => {
	"worklet";
	if (denominator === 0) return fallback;
	return numerator / denominator;
};

const inverseLerp = (value: number, inMin: number, inMax: number): number => {
	"worklet";
	return safeDivide(value - inMin, inMax - inMin, 0);
};

const mapRangeClamped = (
	value: number,
	inMin: number,
	inMax: number,
	outMin: number,
	outMax: number,
): number => {
	"worklet";
	const t = clamp01(inverseLerp(value, inMin, inMax));
	return lerp(outMin, outMax, t);
};

const applyPowerCurve = (value: number, exponent: number): number => {
	"worklet";
	const safeExponent = exponent > 0 ? exponent : 1;
	const magnitude = Math.abs(value) ** safeExponent;
	return value < 0 ? -magnitude : magnitude;
};

const normalizedToTranslation = ({
	normalized,
	dimension,
	resistance,
}: {
	normalized: number;
	dimension: number;
	resistance: number;
}): number => {
	"worklet";
	const distance = Math.max(0, dimension) * resistance;
	return mapRangeClamped(normalized, -1, 1, -distance, distance);
};

const normalizedToScale = ({
	normalized,
	outputRange,
	exponent = 1,
	positiveOnly = true,
}: {
	normalized: number;
	outputRange: readonly [number, number];
	exponent?: number;
	positiveOnly?: boolean;
}): number => {
	"worklet";
	const [outputStart, outputEnd] = outputRange;
	const raw = positiveOnly
		? mapRangeClamped(normalized, 0, 1, outputStart, outputEnd)
		: mapRangeClamped(normalized, -1, 1, outputStart, outputEnd);

	return applyPowerCurve(raw, exponent);
};

const combineScales = (
	scaleX: number,
	scaleY: number,
	mode: CombinedScaleMode = "multiply",
): number => {
	"worklet";

	switch (mode) {
		case "average":
			return (scaleX + scaleY) / 2;
		case "max":
			return Math.max(scaleX, scaleY);
		case "min":
			return Math.min(scaleX, scaleY);
		default:
			return scaleX * scaleY;
	}
};

const computeCenterScaleShift = ({
	center,
	containerCenter,
	scale,
}: {
	center: number;
	containerCenter: number;
	scale: number;
}): number => {
	"worklet";
	return (center - containerCenter) * (scale - 1);
};

const compensateTranslationForParentScale = ({
	translation,
	parentScale,
	epsilon,
}: {
	translation: number;
	parentScale: number;
	epsilon: number;
}): number => {
	"worklet";
	const safeParentScale = Math.max(parentScale, epsilon);
	return safeDivide(translation, safeParentScale, translation);
};

const composeCompensatedTranslation = ({
	gesture,
	parentScale,
	centerShift = 0,
	epsilon,
}: {
	gesture: number;
	parentScale: number;
	centerShift?: number;
	epsilon: number;
}): number => {
	"worklet";
	return (
		compensateTranslationForParentScale({
			translation: gesture,
			parentScale,
			epsilon,
		}) + centerShift
	);
};

const resolveDirectionalDragScale = ({
	normalized,
	dismissDirection,
	shrinkMin,
	growMax,
	exponent,
}: {
	normalized: number;
	dismissDirection: "positive" | "negative";
	shrinkMin: number;
	growMax: number;
	exponent: number;
}) => {
	"worklet";

	const dismissalRelative =
		dismissDirection === "negative" ? -normalized : normalized;

	if (dismissalRelative >= 0) {
		return normalizedToScale({
			normalized: dismissalRelative,
			outputRange: [1, shrinkMin],
			exponent,
		});
	}

	const oppositeDrag = Math.min(1, Math.abs(dismissalRelative));
	return interpolate(oppositeDrag, [0, 1], [1, growMax], "clamp");
};

const getZoomContentTarget = ({
	explicitTarget,
	resolvedTag,
	currentRouteKey,
	previousRouteKey,
	nextRouteKey,
	entering,
	screenLayout,
	anchor,
	resolvedPair,
}: {
	explicitTarget: BoundsOptions["target"] | undefined;
	resolvedTag: string;
	currentRouteKey?: string;
	previousRouteKey?: string;
	nextRouteKey?: string;
	entering: boolean;
	screenLayout: Layout;
	anchor: BoundsOptions["anchor"] | undefined;
	resolvedPair?: ResolvedTransitionPair;
}) => {
	"worklet";
	if (explicitTarget !== undefined) return explicitTarget;

	const pair =
		resolvedPair ??
		BoundStore.resolveTransitionPair(resolvedTag, {
			currentScreenKey: currentRouteKey,
			previousScreenKey: previousRouteKey,
			nextScreenKey: nextRouteKey,
			entering,
		});

	const sourceBounds = pair.sourceBounds;
	const screenWidth = screenLayout.width;

	if (!sourceBounds || sourceBounds.width <= 0 || screenWidth <= 0) {
		return "fullscreen" as const;
	}

	const height = (sourceBounds.height / sourceBounds.width) * screenWidth;
	let horizontalAnchor: "leading" | "center" | "trailing";
	switch (anchor) {
		case "topLeading":
		case "leading":
		case "bottomLeading":
			horizontalAnchor = "leading";
			break;
		case "topTrailing":
		case "trailing":
		case "bottomTrailing":
			horizontalAnchor = "trailing";
			break;
		default:
			horizontalAnchor = "center";
			break;
	}

	let verticalAnchor: "top" | "center" | "bottom";
	switch (anchor) {
		case "topLeading":
		case "top":
		case "topTrailing":
			verticalAnchor = "top";
			break;
		case "bottomLeading":
		case "bottom":
		case "bottomTrailing":
			verticalAnchor = "bottom";
			break;
		default:
			verticalAnchor = "center";
			break;
	}
	const x =
		horizontalAnchor === "leading"
			? 0
			: horizontalAnchor === "trailing"
				? screenLayout.width - screenWidth
				: (screenLayout.width - screenWidth) / 2;
	const y =
		verticalAnchor === "top"
			? 0
			: verticalAnchor === "bottom"
				? screenLayout.height - height
				: (screenLayout.height - height) / 2;

	return {
		x,
		y,
		pageX: x,
		pageY: y,
		width: screenWidth,
		height,
	};
};

const getStyleRadius = (
	styles: StyleProps | null,
	property:
		| "borderRadius"
		| "borderTopLeftRadius"
		| "borderTopRightRadius"
		| "borderBottomLeftRadius"
		| "borderBottomRightRadius",
): number | undefined => {
	"worklet";
	if (!styles || typeof styles !== "object") return undefined;

	const styleRecord = styles as Record<string, unknown>;
	const direct = styleRecord[property];
	if (typeof direct === "number") return direct;

	if (property !== "borderRadius") {
		const fallback = styleRecord.borderRadius;
		if (typeof fallback === "number") return fallback;
	}

	return undefined;
};

const resolveRadiusRange = ({
	value,
	progress,
	sourceRadius,
	destinationRadius,
	fallback,
}: {
	value: ZoomRadiusValue | undefined;
	progress: number;
	sourceRadius?: number;
	destinationRadius?: number;
	fallback: number;
}): number => {
	"worklet";

	if (typeof value === "number") return value;

	if (value === "auto") {
		const from = sourceRadius ?? fallback;
		const to = destinationRadius ?? fallback;
		return interpolate(progress, [0, 1], [from, to], "clamp");
	}

	if (value && typeof value === "object") {
		const from = typeof value.from === "number" ? value.from : fallback;
		const to = typeof value.to === "number" ? value.to : fallback;
		return interpolate(progress, [0, 1], [from, to], "clamp");
	}

	const from = sourceRadius ?? fallback;
	const to = destinationRadius ?? fallback;
	return interpolate(progress, [0, 1], [from, to], "clamp");
};

const resolveMaskRadii = ({
	progress,
	zoomOptions,
	resolvedPair,
}: {
	progress: number;
	zoomOptions: ResolvedZoomOptions;
	resolvedPair: ResolvedTransitionPair;
}) => {
	"worklet";
	const sourceStyles = resolvedPair.sourceStyles;
	const destinationStyles = resolvedPair.destinationStyles;

	const defaultRadius = resolveRadiusRange({
		value: zoomOptions.mask.borderRadius,
		progress,
		sourceRadius: getStyleRadius(sourceStyles, "borderRadius"),
		destinationRadius: getStyleRadius(destinationStyles, "borderRadius"),
		fallback: 12,
	});

	const topLeftValue =
		zoomOptions.mask.borderTopLeftRadius ?? zoomOptions.mask.borderRadius;
	const topRightValue =
		zoomOptions.mask.borderTopRightRadius ?? zoomOptions.mask.borderRadius;
	const bottomLeftValue =
		zoomOptions.mask.borderBottomLeftRadius ?? zoomOptions.mask.borderRadius;
	const bottomRightValue =
		zoomOptions.mask.borderBottomRightRadius ?? zoomOptions.mask.borderRadius;

	return {
		borderRadius: defaultRadius,
		borderTopLeftRadius: resolveRadiusRange({
			value: topLeftValue,
			progress,
			sourceRadius: getStyleRadius(sourceStyles, "borderTopLeftRadius"),
			destinationRadius: getStyleRadius(
				destinationStyles,
				"borderTopLeftRadius",
			),
			fallback: defaultRadius,
		}),
		borderTopRightRadius: resolveRadiusRange({
			value: topRightValue,
			progress,
			sourceRadius: getStyleRadius(sourceStyles, "borderTopRightRadius"),
			destinationRadius: getStyleRadius(
				destinationStyles,
				"borderTopRightRadius",
			),
			fallback: defaultRadius,
		}),
		borderBottomLeftRadius: resolveRadiusRange({
			value: bottomLeftValue,
			progress,
			sourceRadius: getStyleRadius(sourceStyles, "borderBottomLeftRadius"),
			destinationRadius: getStyleRadius(
				destinationStyles,
				"borderBottomLeftRadius",
			),
			fallback: defaultRadius,
		}),
		borderBottomRightRadius: resolveRadiusRange({
			value: bottomRightValue,
			progress,
			sourceRadius: getStyleRadius(sourceStyles, "borderBottomRightRadius"),
			destinationRadius: getStyleRadius(
				destinationStyles,
				"borderBottomRightRadius",
			),
			fallback: defaultRadius,
		}),
	};
};

export const buildZoomStyles = ({
	id,
	group,
	zoomOptions,
	props,
	resolveTag,
	computeRaw,
}: BuildZoomStylesParams): TransitionInterpolatedStyle => {
	"worklet";

	const focused = props.focused;
	const progress = props.progress;
	const currentRouteKey = props.current?.route.key;
	const previousRouteKey = props.previous?.route.key;
	const nextRouteKey = props.next?.route.key;
	const entering = !props.next;
	const screenLayout = props.layouts.screen;

	const resolvedConfig = resolveZoomConfig({
		id,
		group,
		zoomOptions,
		currentRouteKey,
		resolveTag,
		defaultAnchor: "top",
	});

	if (!resolvedConfig) return NO_STYLES;

	const {
		resolvedTag,
		sharedOptions,
		explicitTarget,
		zoomOptions: resolvedZoomOptions,
	} = resolvedConfig;

	const normX = props.active.gesture.normX;
	const normY = props.active.gesture.normY;
	const initialDirection = props.active.gesture.direction;
	const dragX = normalizedToTranslation({
		normalized: normX,
		dimension: screenLayout.width,
		resistance: resolvedZoomOptions.motion.dragResistance,
	});
	const dragY = normalizedToTranslation({
		normalized: normY,
		dimension: screenLayout.height,
		resistance: resolvedZoomOptions.motion.dragResistance,
	});
	const dragXScale =
		initialDirection === "horizontal" ||
		initialDirection === "horizontal-inverted"
			? resolveDirectionalDragScale({
					normalized: normX,
					dismissDirection:
						initialDirection === "horizontal-inverted"
							? "negative"
							: "positive",
					shrinkMin: resolvedZoomOptions.motion.dragDirectionalScaleMin,
					growMax: resolvedZoomOptions.motion.dragDirectionalScaleMax,
					exponent: 2,
				})
			: IDENTITY_DRAG_SCALE_OUTPUT[0];
	const dragYScale =
		initialDirection === "vertical" || initialDirection === "vertical-inverted"
			? resolveDirectionalDragScale({
					normalized: normY,
					dismissDirection:
						initialDirection === "vertical-inverted" ? "negative" : "positive",
					shrinkMin: resolvedZoomOptions.motion.dragDirectionalScaleMin,
					growMax: resolvedZoomOptions.motion.dragDirectionalScaleMax,
					exponent: 2,
				})
			: IDENTITY_DRAG_SCALE_OUTPUT[1];
	const dragScale = combineScales(dragXScale, dragYScale);

	if (focused) {
		const focusedPair = BoundStore.resolveTransitionPair(resolvedTag, {
			currentScreenKey: currentRouteKey,
			previousScreenKey: previousRouteKey,
			nextScreenKey: nextRouteKey,
			entering,
		});

		const contentTarget = getZoomContentTarget({
			explicitTarget,
			resolvedTag,
			currentRouteKey,
			previousRouteKey,
			nextRouteKey,
			entering,
			screenLayout,
			anchor: sharedOptions.anchor,
			resolvedPair: focusedPair,
		});

		const contentRaw = computeRaw({
			...sharedOptions,
			method: "content",
			target: contentTarget,
		});

		const maskRaw = computeRaw({
			...sharedOptions,
			method: "size",
			space: "absolute",
			target: "fullscreen",
		});

		const focusedFade = props.active?.closing
			? interpolate(progress, [0.6, 1], [0, 1], "clamp")
			: interpolate(progress, [0, 0.5], [0, 1], "clamp");
		const { top, right, bottom, left } = resolvedZoomOptions.mask.outset;
		const maskWidth = Math.max(1, toNumber(maskRaw.width) + left + right);
		const maskHeight = Math.max(1, toNumber(maskRaw.height) + top + bottom);
		const contentTranslateX = toNumber(contentRaw.translateX) + dragX;
		const contentTranslateY = toNumber(contentRaw.translateY) + dragY;
		const contentScale = toNumber(contentRaw.scale, 1) * dragScale;
		const maskTranslateX = toNumber(maskRaw.translateX) + dragX - left;
		const maskTranslateY = toNumber(maskRaw.translateY) + dragY - top;
		const maskRadii = resolveMaskRadii({
			progress,
			zoomOptions: resolvedZoomOptions,
			resolvedPair: focusedPair,
		});

		return {
			[NAVIGATION_CONTAINER_STYLE_ID]: {
				style: {
					opacity: focusedFade,
					transform: [
						{ translateX: contentTranslateX },
						{ translateY: contentTranslateY },
						{ scale: contentScale },
					],
				},
			},
			[NAVIGATION_MASK_STYLE_ID]: {
				style: {
					width: maskWidth,
					height: maskHeight,
					transform: [
						{ translateX: maskTranslateX },
						{ translateY: maskTranslateY },
						{ scale: dragScale },
					],
					borderRadius: maskRadii.borderRadius,
					borderTopLeftRadius: maskRadii.borderTopLeftRadius,
					borderTopRightRadius: maskRadii.borderTopRightRadius,
					borderBottomLeftRadius: maskRadii.borderBottomLeftRadius,
					borderBottomRightRadius: maskRadii.borderBottomRightRadius,
					...(resolvedZoomOptions.mask.borderCurve
						? { borderCurve: resolvedZoomOptions.mask.borderCurve }
						: {}),
				},
			},
			// Signal the destination boundary to stay visible during the transition.
			// Without this, useAssociatedStyles enters "waiting-first-style" mode
			// (opacity: 0) because it detects previous-screen evidence but never
			// receives a resolved style for this tag.
			[resolvedTag]: {
				style: { opacity: 1 },
			},
		};
	}

	const unfocusedFade = props.active?.closing
		? interpolate(progress, [1.6, 2], [1, 0], "clamp")
		: interpolate(progress, [1, 1.5], [1, 0], "clamp");
	const unfocusedScale = interpolate(progress, [1, 2], [1, 0.95], "clamp");
	const isUnfocusedIdle = props.active.settled === 1;

	const elementTarget =
		sharedOptions.scaleMode === "match"
			? ("fullscreen" as const)
			: getZoomContentTarget({
					explicitTarget,
					resolvedTag,
					currentRouteKey,
					previousRouteKey,
					nextRouteKey,
					entering,
					screenLayout,
					anchor: sharedOptions.anchor,
				});

	const elementRaw = computeRaw({
		...sharedOptions,
		method: "transform",
		space: "relative",
		target: elementTarget,
	});

	// Keep compensation tied to the element target's center. In `scaleMode: "match"`
	// this target is fullscreen, so the center offset should resolve to zero.
	const elementCenterY =
		typeof elementTarget === "object"
			? elementTarget.pageY + elementTarget.height / 2
			: screenLayout.height / 2;

	const scaleShiftY = computeCenterScaleShift({
		center: elementCenterY,
		containerCenter: screenLayout.height / 2,
		scale: dragScale,
	});

	const compensatedGestureX = composeCompensatedTranslation({
		gesture: dragX,
		parentScale: unfocusedScale,
		epsilon: EPSILON,
	});
	// dragY is measured in screen space and must be unscaled by the parent
	// content shrink, while scaleShiftY is already in the parent's local space.
	const compensatedGestureY = composeCompensatedTranslation({
		gesture: dragY,
		parentScale: unfocusedScale,
		centerShift: scaleShiftY,
		epsilon: EPSILON,
	});
	const elementTranslateX =
		toNumber(elementRaw.translateX) + compensatedGestureX;
	const elementTranslateY =
		toNumber(elementRaw.translateY) + compensatedGestureY;
	const elementScaleX = toNumber(elementRaw.scaleX, 1) * dragScale;
	const elementScaleY = toNumber(elementRaw.scaleY, 1) * dragScale;

	const resolvedElementStyle = isUnfocusedIdle
		? {
				transform: [
					{ translateX: 0 },
					{ translateY: 0 },
					{ scaleX: 1 },
					{ scaleY: 1 },
				],
				opacity: 0,
				zIndex: 0,
				elevation: 0,
			}
		: {
				transform: [
					{ translateX: elementTranslateX },
					{ translateY: elementTranslateY },
					{ scaleX: elementScaleX },
					{ scaleY: elementScaleY },
				],
				opacity: unfocusedFade,
				zIndex: 9999,
				elevation: 9999,
			};

	return {
		content: {
			style: {
				transform: [{ scale: unfocusedScale }],
			},
		},
		[resolvedTag]: {
			style: resolvedElementStyle,
		},
	};
};
