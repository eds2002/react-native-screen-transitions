import { interpolate } from "react-native-reanimated";
import {
	EPSILON,
	NAVIGATION_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_STYLE_ID,
	NO_STYLES,
} from "../../../../constants";
import { BoundStore } from "../../../../stores/bounds.store";
import type { TransitionInterpolatedStyle } from "../../../../types/animation.types";
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
import { resolveNavigationConfig, toNumber } from "./helpers";
import type { BuildNavigationStylesParams } from "./types";

const getZoomContentTarget = ({
	explicitTarget,
	resolvedTag,
	currentRouteKey,
	screenLayout,
	anchor,
}: {
	explicitTarget: BoundsOptions["target"] | undefined;
	resolvedTag: string;
	currentRouteKey?: string;
	screenLayout: Layout;
	anchor: BoundsOptions["anchor"] | undefined;
}) => {
	"worklet";
	if (explicitTarget !== undefined) return explicitTarget;

	const scopedLink = BoundStore.getActiveLink(resolvedTag, currentRouteKey);
	const latestLink = scopedLink ?? BoundStore.getActiveLink(resolvedTag);
	const sourceBounds = latestLink?.source?.bounds;
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
	const screenLayout = props.layouts.screen;

	const normX = props.active.gesture.normalizedX;
	const normY = props.active.gesture.normalizedY;
	const initialDirection = props.active.gesture.direction;

	const xResistance = initialDirection === "horizontal" ? 0.4 : 0.4;
	const yResistance = initialDirection === "vertical" ? 0.4 : 0.4;

	const xScaleOutput =
		initialDirection === "horizontal"
			? ([1, 0.25] as const)
			: ([1, 1] as const);
	const yScaleOutput =
		initialDirection === "vertical" ? ([1, 0.25] as const) : ([1, 1] as const);

	const dragX = normalizedToTranslation({
		normalized: normX,
		dimension: screenLayout.width,
		resistance: xResistance,
	});
	const dragY = normalizedToTranslation({
		normalized: normY,
		dimension: screenLayout.height,
		resistance: yResistance,
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

	const resolvedConfig = resolveNavigationConfig({
		id,
		group,
		navigationOptions,
		currentRouteKey,
		resolveTag,
		defaultAnchor: "top",
	});

	if (!resolvedConfig) return NO_STYLES;

	const { resolvedTag, sharedOptions, explicitTarget } = resolvedConfig;

	const contentTarget = getZoomContentTarget({
		explicitTarget,
		resolvedTag,
		currentRouteKey,
		screenLayout,
		anchor: sharedOptions.anchor,
	});

	// When scaleMode is "match", the source element should track the mask
	// dimensions exactly (independent scaleX/scaleY). The mask always targets
	// fullscreen, so the element must target the same to stay in sync.
	const elementTarget =
		sharedOptions.scaleMode === "match"
			? ("fullscreen" as const)
			: contentTarget;

	const elementRaw = computeRaw({
		...sharedOptions,
		method: "transform",
		space: "relative",
		target: elementTarget,
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

	const unfocusedFade = props.active?.closing
		? interpolate(progress, [1.6, 2], [1, 0], "clamp")
		: interpolate(progress, [1, 1.5], [1, 0], "clamp");

	const unfocusedScale = interpolateClamped(progress, [1, 2], [1, 0.9]);
	const rawMaskWidth = toNumber(maskRaw.width);
	const rawMaskHeight = toNumber(maskRaw.height);
	const maskWidth = Math.max(1, rawMaskWidth);
	const maskHeight = Math.max(1, rawMaskHeight);

	if (focused) {
		return {
			[NAVIGATION_CONTAINER_STYLE_ID]: {
				style: {
					opacity: focusedFade,
					transform: [
						{ translateX: toNumber(contentRaw.translateX) + dragX },
						{ translateY: toNumber(contentRaw.translateY) + dragY },
						{ scale: toNumber(contentRaw.scale, 1) },
						{ scale: dragXScale },
						{ scale: dragYScale },
					],
				},
			},
			[NAVIGATION_MASK_STYLE_ID]: {
				style: {
					width: maskWidth,
					height: maskHeight,
					transform: [
						{ translateX: toNumber(maskRaw.translateX) + dragX },
						{ translateY: toNumber(maskRaw.translateY) + dragY },
						{ scale: dragXScale },
						{ scale: dragYScale },
					],
					borderRadius: 12,
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

	const dragScale = combineScales(dragXScale, dragYScale);

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

	return {
		content: {
			style: {
				transform: [{ scale: unfocusedScale }],
			},
		},
		[resolvedTag]: {
			style: {
				transform: [
					{ translateX: toNumber(elementRaw.translateX) + compensatedGestureX },
					{ translateY: toNumber(elementRaw.translateY) + compensatedGestureY },
					{ scaleX: toNumber(elementRaw.scaleX, 1) * dragScale },
					{ scaleY: toNumber(elementRaw.scaleY, 1) * dragScale },
				],
				opacity: unfocusedFade,
				zIndex: 9999,
				elevation: 9999,
			},
		},
	};
};
