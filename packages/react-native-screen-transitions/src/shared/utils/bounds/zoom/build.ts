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
import type { TransitionInterpolatedStyle } from "../../../types/animation.types";
import type { Layout } from "../../../types/screen.types";
import { computeBoundStyles } from "../helpers/compute-bounds-styles";
import type { BoundsOptions } from "../types/options";
import {
	getZoomAnchor,
	toNumber,
	ZOOM_DRAG_DIRECTIONAL_SCALE_MAX,
	ZOOM_DRAG_DIRECTIONAL_SCALE_MIN,
	ZOOM_DRAG_RESISTANCE,
	ZOOM_MASK_OUTSET,
	ZOOM_SHARED_OPTIONS,
} from "./config";
import {
	combineScales,
	composeCompensatedTranslation,
	computeCenterScaleShift,
	normalizedToTranslation,
	resolveDirectionalDragScale,
} from "./math";
import type { BuildZoomStylesParams, ZoomInterpolatedStyle } from "./types";

const IDENTITY_DRAG_SCALE_OUTPUT = [1, 1] as const;

const getSourceBorderRadius = (
	resolvedPair: ResolvedTransitionPair,
): number => {
	"worklet";

	return typeof resolvedPair.sourceStyles?.borderRadius === "number"
		? resolvedPair.sourceStyles.borderRadius
		: 0;
};

const getZoomContentTarget = ({
	explicitTarget,
	screenLayout,
	anchor,
	resolvedPair,
}: {
	explicitTarget: BoundsOptions["target"] | undefined;
	screenLayout: Layout;
	anchor: BoundsOptions["anchor"] | undefined;
	resolvedPair: ResolvedTransitionPair;
}) => {
	"worklet";

	if (explicitTarget) return explicitTarget;

	const sourceBounds = resolvedPair.sourceBounds;
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
};

export const buildZoomStyles = ({
	resolvedTag,
	zoomOptions,
	props,
}: BuildZoomStylesParams): ZoomInterpolatedStyle => {
	"worklet";

	if (!resolvedTag) return {};

	const explicitTarget = zoomOptions?.target;
	const debug = zoomOptions?.DEBUG === true;

	const focused = props.focused;
	const progress = props.progress;
	const currentRouteKey = props.current?.route.key;
	const previousRouteKey = props.previous?.route.key;
	const nextRouteKey = props.next?.route.key;
	const entering = !props.next;
	const screenLayout = props.layouts.screen;
	const resolvedZoomAnchor = getZoomAnchor(explicitTarget);
	const zoomComputeParams = {
		id: resolvedTag,
		previous: props.previous,
		current: props.current,
		next: props.next,
		progress,
		dimensions: screenLayout,
	} as const;
	const baseRawOptions = {
		id: resolvedTag,
		raw: true,
		scaleMode: ZOOM_SHARED_OPTIONS.scaleMode,
	} as const;

	const resolvedPair = BoundStore.resolveTransitionPair(resolvedTag, {
		currentScreenKey: currentRouteKey,
		previousScreenKey: previousRouteKey,
		nextScreenKey: nextRouteKey,
		entering,
	});

	const sourceBorderRadius = getSourceBorderRadius(resolvedPair);
	const targetBorderRadius = zoomOptions?.borderRadius ?? sourceBorderRadius;

	const focusedVisibilityStyles = {
		[resolvedTag]: VISIBLE_STYLE,
	} satisfies TransitionInterpolatedStyle;
	const focusedContainerStyleId = props.navigationMaskEnabled
		? NAVIGATION_MASK_CONTAINER_STYLE_ID
		: "content";

	// To avoid initial flickering, we'll want to hide if there are no source bounds
	// But to also avoid scenarios where activeId changes in dst and theres a failed measurement,
	// we should only hide if entering and there is no source bounds.
	if (!resolvedPair.sourceBounds && props.active.entering) {
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
		resistance: ZOOM_DRAG_RESISTANCE,
	});
	const dragY = normalizedToTranslation({
		normalized: normY,
		dimension: screenLayout.height,
		resistance: ZOOM_DRAG_RESISTANCE,
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
					shrinkMin: ZOOM_DRAG_DIRECTIONAL_SCALE_MIN,
					growMax: ZOOM_DRAG_DIRECTIONAL_SCALE_MAX,
					exponent: 2,
				})
			: IDENTITY_DRAG_SCALE_OUTPUT[0];
	const dragYScale =
		initialDirection === "vertical" || initialDirection === "vertical-inverted"
			? resolveDirectionalDragScale({
					normalized: normY,
					dismissDirection:
						initialDirection === "vertical-inverted" ? "negative" : "positive",
					shrinkMin: ZOOM_DRAG_DIRECTIONAL_SCALE_MIN,
					growMax: ZOOM_DRAG_DIRECTIONAL_SCALE_MAX,
					exponent: 2,
				})
			: IDENTITY_DRAG_SCALE_OUTPUT[1];
	const dragScale = combineScales(dragXScale, dragYScale);

	if (focused) {
		const contentTarget = getZoomContentTarget({
			explicitTarget,
			screenLayout,
			anchor: ZOOM_SHARED_OPTIONS.anchor,
			resolvedPair,
		});

		const contentRaw = computeBoundStyles(
			zoomComputeParams,
			{
				...baseRawOptions,
				anchor: resolvedZoomAnchor,
				method: "content",
				target: contentTarget,
			},
			resolvedPair,
		) as Record<string, unknown>;

		const maskRaw = computeBoundStyles(
			zoomComputeParams,
			{
				...baseRawOptions,
				anchor: ZOOM_SHARED_OPTIONS.anchor,
				method: "size",
				space: "absolute",
				target: "fullscreen",
			},
			resolvedPair,
		) as Record<string, unknown>;

		const focusedFade = props.active?.closing
			? interpolate(progress, [0.6, 1], [0, debug ? 0.5 : 1], "clamp")
			: interpolate(progress, [0, 0.5], [0, debug ? 0.5 : 1], "clamp");

		/**
		 * This is also how swiftui handles their navigation zoom.
		 * They remove clipping as soon as the screen stops animating
		 */
		const shouldRemoveClipping = !props.active.animating;
		const focusedMaskBorderRadius = interpolate(
			progress,
			[0, 1],
			[sourceBorderRadius, shouldRemoveClipping ? 0 : targetBorderRadius],
			"clamp",
		);

		const { top, right, bottom, left } = ZOOM_MASK_OUTSET;
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
			borderRadius: focusedMaskBorderRadius,
			overflow: "hidden" as const,
		};

		const focusedStyles: ZoomInterpolatedStyle = {
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
					borderRadius: focusedMaskBorderRadius,
					transform: [
						{ translateX: maskTranslateX },
						{ translateY: maskTranslateY },
						{ scale: dragScale },
					],
				},
			};
		}

		return focusedStyles;
	}

	const unfocusedFade = props.active?.closing
		? interpolate(progress, [1.6, 2], [1, debug ? 1 : 0], "clamp")
		: interpolate(progress, [1, 1.5], [1, debug ? 1 : 0], "clamp");

	const unfocusedScale = interpolate(progress, [1, 2], [1, 0.95], "clamp");
	const isUnfocusedIdle = props.active.settled === 1;
	const shouldHideUnfocusedIdle = isUnfocusedIdle && !debug;
	const elementTarget =
		explicitTarget !== undefined || resolvedPair.destinationBounds
			? getZoomContentTarget({
					explicitTarget,
					screenLayout,
					anchor: ZOOM_SHARED_OPTIONS.anchor,
					resolvedPair,
				})
			: ("fullscreen" as const);

	const elementRaw = computeBoundStyles(
		zoomComputeParams,
		{
			...baseRawOptions,
			anchor: resolvedZoomAnchor,
			method: "transform",
			space: "relative",
			target: elementTarget,
		},
		resolvedPair,
	) as Record<string, unknown>;
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
	const resolvedElementStyle = shouldHideUnfocusedIdle
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
					{
						translateX:
							props.active.logicallySettled && !props.active.closing
								? 0
								: elementTranslateX,
					},
					{
						translateY:
							props.active.logicallySettled && !props.active.closing
								? 0
								: elementTranslateY,
					},
					{
						scaleX:
							props.active.logicallySettled && !props.active.closing
								? 1
								: elementScaleX,
					},
					{
						scaleY:
							props.active.logicallySettled && !props.active.closing
								? 1
								: elementScaleY,
					},
				],
				opacity: debug ? 0.5 : unfocusedFade,
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
