import { interpolate, type StyleProps } from "react-native-reanimated";
import {
	EPSILON,
	NAVIGATION_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_STYLE_ID,
	NO_STYLES,
} from "../../../../constants";
import {
	BoundStore,
	type ResolvedTransitionPair,
} from "../../../../stores/bounds";
import type { TransitionInterpolatedStyle } from "../../../../types/animation.types";
import type { ZoomRadiusValue } from "../../../../types/bounds.types";
import type { Layout } from "../../../../types/screen.types";
import { interpolateClamped } from "../../helpers/interpolate";
import {
	combineScales,
	composeCompensatedTranslation,
	computeCenterScaleShift,
	normalizedToScale,
	normalizedToTranslation,
} from "../../helpers/math";
import type { BoundsOptions } from "../../types/options";
import {
	type ResolvedNavigationZoomOptions,
	resolveNavigationConfig,
	toNumber,
} from "./helpers";
import type { BuildNavigationStylesParams } from "./types";

const IDENTITY_DRAG_SCALE_OUTPUT = [1, 1] as const;

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
	zoomOptions: ResolvedNavigationZoomOptions;
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

export const buildZoomNavigationStyles = ({
	id,
	group,
	navigationOptions,
	props,
	resolveTag,
	computeRaw,
}: BuildNavigationStylesParams): TransitionInterpolatedStyle => {
	"worklet";

	const focused = props.focused;
	const progress = props.progress;
	const currentRouteKey = props.current?.route.key;
	const previousRouteKey = props.previous?.route.key;
	const nextRouteKey = props.next?.route.key;
	const entering = !props.next;
	const screenLayout = props.layouts.screen;

	const resolvedConfig = resolveNavigationConfig({
		id,
		group,
		navigationOptions,
		currentRouteKey,
		resolveTag,
		defaultAnchor: "top",
	});

	if (!resolvedConfig) return NO_STYLES;

	const { resolvedTag, sharedOptions, explicitTarget, zoomOptions } =
		resolvedConfig;

	const normX = props.active.gesture.normX;
	const normY = props.active.gesture.normY;
	const initialDirection = props.active.gesture.direction;
	const directionalDragScaleOutput: [number, number] = [
		1,
		zoomOptions.motion.dragDirectionalScaleMin,
	];

	const xScaleOutput =
		initialDirection === "horizontal"
			? directionalDragScaleOutput
			: IDENTITY_DRAG_SCALE_OUTPUT;
	const yScaleOutput =
		initialDirection === "vertical"
			? directionalDragScaleOutput
			: IDENTITY_DRAG_SCALE_OUTPUT;

	const dragX = normalizedToTranslation({
		normalized: normX,
		dimension: screenLayout.width,
		resistance: zoomOptions.motion.dragResistance,
	});
	const dragY = normalizedToTranslation({
		normalized: normY,
		dimension: screenLayout.height,
		resistance: zoomOptions.motion.dragResistance,
	});
	const dragXScale = normalizedToScale({
		normalized: normX,
		outputRange: xScaleOutput,
		exponent: 2,
	});
	const dragYScale = normalizedToScale({
		normalized: normY,
		outputRange: yScaleOutput,
		exponent: 2,
	});
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
		const { top, right, bottom, left } = zoomOptions.mask.outset;
		const maskWidth = Math.max(1, toNumber(maskRaw.width) + left + right);
		const maskHeight = Math.max(1, toNumber(maskRaw.height) + top + bottom);
		const contentTranslateX = toNumber(contentRaw.translateX) + dragX;
		const contentTranslateY = toNumber(contentRaw.translateY) + dragY;
		const contentScale = toNumber(contentRaw.scale, 1) * dragScale;
		const maskTranslateX = toNumber(maskRaw.translateX) + dragX - left;
		const maskTranslateY = toNumber(maskRaw.translateY) + dragY - top;
		const maskRadii = resolveMaskRadii({
			progress,
			zoomOptions,
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
					...(zoomOptions.mask.borderCurve
						? { borderCurve: zoomOptions.mask.borderCurve }
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
	const unfocusedScale = interpolateClamped(progress, [1, 2], [1, 0.95]);
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
