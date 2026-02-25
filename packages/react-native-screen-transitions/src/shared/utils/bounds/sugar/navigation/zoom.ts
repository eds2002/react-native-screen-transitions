import { interpolate } from "react-native-reanimated";
import {
	EPSILON,
	NAVIGATION_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_STYLE_ID,
	NO_STYLES,
} from "../../../../constants";
import { BoundStore } from "../../../../stores/bounds";
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

const DRAG_RESISTANCE = 0.4;
const DIRECTIONAL_DRAG_SCALE_OUTPUT = [1, 0.25] as const;
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
}: {
	explicitTarget: BoundsOptions["target"] | undefined;
	resolvedTag: string;
	currentRouteKey?: string;
	previousRouteKey?: string;
	nextRouteKey?: string;
	entering: boolean;
	screenLayout: Layout;
	anchor: BoundsOptions["anchor"] | undefined;
}) => {
	"worklet";
	if (explicitTarget !== undefined) return explicitTarget;

	const resolvedPair = BoundStore.resolveTransitionPair(resolvedTag, {
		currentScreenKey: currentRouteKey,
		previousScreenKey: previousRouteKey,
		nextScreenKey: nextRouteKey,
		entering,
	});
	const sourceBounds = resolvedPair.sourceBounds;
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
	const previousRouteKey = props.previous?.route.key;
	const nextRouteKey = props.next?.route.key;
	const entering = !props.next;
	const screenLayout = props.layouts.screen;

	const normX = props.active.gesture.normalizedX;
	const normY = props.active.gesture.normalizedY;
	const initialDirection = props.active.gesture.direction;

	const xScaleOutput =
		initialDirection === "horizontal"
			? DIRECTIONAL_DRAG_SCALE_OUTPUT
			: IDENTITY_DRAG_SCALE_OUTPUT;
	const yScaleOutput =
		initialDirection === "vertical"
			? DIRECTIONAL_DRAG_SCALE_OUTPUT
			: IDENTITY_DRAG_SCALE_OUTPUT;

	const dragX = normalizedToTranslation({
		normalized: normX,
		dimension: screenLayout.width,
		resistance: DRAG_RESISTANCE,
	});
	const dragY = normalizedToTranslation({
		normalized: normY,
		dimension: screenLayout.height,
		resistance: DRAG_RESISTANCE,
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

	if (focused) {
		const contentTarget = getZoomContentTarget({
			explicitTarget,
			resolvedTag,
			currentRouteKey,
			previousRouteKey,
			nextRouteKey,
			entering,
			screenLayout,
			anchor: sharedOptions.anchor,
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
		const maskWidth = Math.max(1, toNumber(maskRaw.width));
		const maskHeight = Math.max(1, toNumber(maskRaw.height));
		const contentTranslateX = toNumber(contentRaw.translateX) + dragX;
		const contentTranslateY = toNumber(contentRaw.translateY) + dragY;
		const contentScale = toNumber(contentRaw.scale, 1) * dragScale;
		const maskTranslateX = toNumber(maskRaw.translateX) + dragX;
		const maskTranslateY = toNumber(maskRaw.translateY) + dragY;

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
