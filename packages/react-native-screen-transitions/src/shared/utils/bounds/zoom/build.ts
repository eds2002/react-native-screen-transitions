import { interpolate } from "react-native-reanimated";
import {
	EPSILON,
	HIDDEN_STYLE,
	NAVIGATION_MASK_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
	VISIBLE_STYLE,
} from "../../../constants";
import {
	BoundStore,
	type ResolvedTransitionPair,
} from "../../../stores/bounds";
import type {
	ScreenStyleInterpolator,
	TransitionInterpolatedStyle,
} from "../../../types/animation.types";
import type { Layout } from "../../../types/screen.types";
import type { BoundsOptions } from "../types/options";
import { resolveZoomConfig, toNumber } from "./config";
import {
	combineScales,
	composeCompensatedTranslation,
	computeCenterScaleShift,
	normalizedToTranslation,
	resolveDirectionalDragScale,
} from "./math";
import type { BuildZoomStylesParams } from "./types";

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

export const buildZoomStyles = ({
	id,
	group,
	zoomOptions,
	props,
	resolveTag,
	computeRaw,
}: BuildZoomStylesParams): ReturnType<ScreenStyleInterpolator> => {
	"worklet";

	const focused = props.focused;
	const progress = props.progress;
	const currentRouteKey = props.current?.route.key;
	const previousRouteKey = props.previous?.route.key;
	const nextRouteKey = props.next?.route.key;
	const entering = !props.next;
	const screenLayout = props.layouts.screen;
	const transitionContext = {
		currentScreenKey: currentRouteKey,
		previousScreenKey: previousRouteKey,
		nextScreenKey: nextRouteKey,
		entering,
	};

	const resolvedConfig = resolveZoomConfig({
		id,
		group,
		zoomOptions,
		currentRouteKey,
		resolveTag,
	});

	if (!resolvedConfig) return null;

	const {
		resolvedTag,
		sharedOptions,
		explicitTarget,
		zoomOptions: resolvedZoomOptions,
	} = resolvedConfig;

	const resolvedPair = BoundStore.resolveTransitionPair(
		resolvedTag,
		transitionContext,
	);

	const focusedVisibilityStyles = {
		[resolvedTag]: VISIBLE_STYLE,
	} satisfies TransitionInterpolatedStyle;
	const focusedContainerStyleId = props.navigationMaskEnabled
		? NAVIGATION_MASK_CONTAINER_STYLE_ID
		: "content";

	if (!resolvedPair.sourceBounds) {
		return {
			[focusedContainerStyleId]: HIDDEN_STYLE,
		};
	}

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
	const resolvedZoomAnchor =
		explicitTarget === "bound" ? "center" : sharedOptions.anchor;

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
			resolvedPair,
		});

		const contentRaw = computeRaw({
			...sharedOptions,
			anchor: resolvedZoomAnchor,
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
		const focusedContentStyle = {
			opacity: focusedFade,
			transform: [
				{ translateX: contentTranslateX },
				{ translateY: contentTranslateY },
				{ scale: contentScale },
			],
		};

		const focusedStyles: TransitionInterpolatedStyle = {
			[focusedContainerStyleId]: {
				style: focusedContentStyle,
			},
			...focusedVisibilityStyles,
		};

		if (props.navigationMaskEnabled) {
			focusedStyles[NAVIGATION_MASK_ELEMENT_STYLE_ID] = {
				style: {
					width: maskWidth,
					height: maskHeight,
					transform: [
						{ translateX: maskTranslateX },
						{ translateY: maskTranslateY },
						{ scale: dragScale },
					],
					...(resolvedZoomOptions.mask.borderCurve
						? { borderCurve: resolvedZoomOptions.mask.borderCurve }
						: {}),
				},
			};
		}

		return focusedStyles;
	}

	const unfocusedFade = props.active?.closing
		? interpolate(progress, [1.6, 2], [1, 0], "clamp")
		: interpolate(progress, [1, 1.5], [1, 0], "clamp");
	const unfocusedScale = interpolate(progress, [1, 2], [1, 0.95], "clamp");
	const isUnfocusedIdle = props.active.settled === 1;

	const elementTarget =
		explicitTarget !== undefined || resolvedPair.destinationBounds
			? getZoomContentTarget({
					explicitTarget,
					resolvedTag,
					currentRouteKey,
					previousRouteKey,
					nextRouteKey,
					entering,
					screenLayout,
					anchor: sharedOptions.anchor,
					resolvedPair,
				})
			: ("fullscreen" as const);

	const elementRaw = computeRaw({
		...sharedOptions,
		anchor: resolvedZoomAnchor,
		method: "transform",
		space: "relative",
		target: elementTarget,
	});

	const boundTargetCenterX =
		explicitTarget === "bound" && resolvedPair.destinationBounds
			? resolvedPair.destinationBounds.pageX +
				resolvedPair.destinationBounds.width / 2
			: undefined;
	const boundTargetCenterY =
		explicitTarget === "bound" && resolvedPair.destinationBounds
			? resolvedPair.destinationBounds.pageY +
				resolvedPair.destinationBounds.height / 2
			: undefined;
	const elementCenterX =
		boundTargetCenterX ??
		(typeof elementTarget === "object"
			? elementTarget.pageX + elementTarget.width / 2
			: screenLayout.width / 2);
	const elementCenterY =
		boundTargetCenterY ??
		(typeof elementTarget === "object"
			? elementTarget.pageY + elementTarget.height / 2
			: screenLayout.height / 2);

	const scaleShiftX = computeCenterScaleShift({
		center: elementCenterX,
		containerCenter: screenLayout.width / 2,
		scale: dragScale,
	});
	const scaleShiftY = computeCenterScaleShift({
		center: elementCenterY,
		containerCenter: screenLayout.height / 2,
		scale: dragScale,
	});

	const compensatedGestureX = composeCompensatedTranslation({
		gesture: dragX,
		parentScale: unfocusedScale,
		centerShift: scaleShiftX,
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
