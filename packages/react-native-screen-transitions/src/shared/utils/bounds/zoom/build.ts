import { interpolate, makeMutable } from "react-native-reanimated";
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
	ZOOM_BACKGROUND_SCALE,
	ZOOM_DRAG_DIRECTIONAL_SCALE_EXPONENT,
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
const presentedZoomTagByRoute = makeMutable<Record<string, string>>({});

/* -------------------------------------------------------------------------- */
/*                               LOCAL HELPERS                                */
/* -------------------------------------------------------------------------- */

function getSourceBorderRadius(resolvedPair: ResolvedTransitionPair): number {
	"worklet";

	return typeof resolvedPair.sourceStyles?.borderRadius === "number"
		? resolvedPair.sourceStyles.borderRadius
		: 0;
}

function getZoomContentTarget({
	explicitTarget,
	screenLayout,
	anchor,
	resolvedPair,
}: {
	explicitTarget: BoundsOptions["target"] | undefined;
	screenLayout: Layout;
	anchor: BoundsOptions["anchor"] | undefined;
	resolvedPair: ResolvedTransitionPair;
}) {
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
}

function resolveDragScaleTuple(
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

function resolveBackgroundScale(value: number | undefined) {
	"worklet";

	return value ?? ZOOM_BACKGROUND_SCALE;
}

function resolveEffectiveZoomTag(params: {
	resolvedTag: string;
	activeRouteKey?: string;
	entering: boolean;
	animating: boolean;
	activeProgress: number;
	livePairReady: boolean;
}) {
	"worklet";

	const {
		resolvedTag,
		activeRouteKey,
		entering,
		animating,
		activeProgress,
		livePairReady,
	} = params;

	// Only grouped ids need retarget stabilization. Plain ids should keep their
	// normal behavior with no route-level caching.
	if (!activeRouteKey || !resolvedTag.includes(":")) {
		return resolvedTag;
	}

	const cachedTag = presentedZoomTagByRoute.value[activeRouteKey];
	const isFreshOpenFrame = entering && activeProgress <= 0.05;
	const shouldFreezeDuringEnter = entering && animating && !isFreshOpenFrame;

	if (!cachedTag || isFreshOpenFrame) {
		presentedZoomTagByRoute.modify((state) => ({
			...state,
			[activeRouteKey]: resolvedTag,
		}));
		return resolvedTag;
	}

	if (shouldFreezeDuringEnter) {
		return cachedTag;
	}

	// After the enter animation, grouped retargeting can still briefly point at a
	// new active id before that tag has usable bounds. Keep presenting the last
	// good tag until the next one is transition-ready.
	if (cachedTag !== resolvedTag && !livePairReady) {
		return cachedTag;
	}

	if (cachedTag !== resolvedTag) {
		presentedZoomTagByRoute.modify((state) => ({
			...state,
			[activeRouteKey]: resolvedTag,
		}));
	}

	return resolvedTag;
}

/* -------------------------------------------------------------------------- */
/*                             BUILD ZOOM STYLES                              */
/* -------------------------------------------------------------------------- */

export function buildZoomStyles({
	resolvedTag,
	zoomOptions,
	props,
}: BuildZoomStylesParams): ZoomInterpolatedStyle {
	"worklet";

	if (!resolvedTag) return {};

	/* ------------------------------ Shared Setup ------------------------------ */

	const explicitTarget = zoomOptions?.target;
	const focused = props.focused;
	const progress = props.progress;
	const screenLayout = props.layouts.screen;
	const isEnteringTransition = !props.next;
	const activeRouteKey = props.active.route.key;
	const currentRouteKey = props.current?.route.key;
	const previousRouteKey = props.previous?.route.key;
	const nextRouteKey = props.next?.route.key;
	const resolvedZoomAnchor = getZoomAnchor(explicitTarget);
	const liveResolvedPair = BoundStore.resolveTransitionPair(resolvedTag, {
		currentScreenKey: currentRouteKey,
		previousScreenKey: previousRouteKey,
		nextScreenKey: nextRouteKey,
		entering: isEnteringTransition,
	});
	const effectiveTag = resolveEffectiveZoomTag({
		resolvedTag,
		activeRouteKey,
		entering: !!props.active.entering,
		animating: !!props.active.animating,
		activeProgress: props.active.progress,
		livePairReady: !!liveResolvedPair.sourceBounds,
	});

	const zoomComputeParams = {
		id: effectiveTag,
		previous: props.previous,
		current: props.current,
		next: props.next,
		progress,
		dimensions: screenLayout,
	} as const;

	const baseRawOptions = {
		id: effectiveTag,
		raw: true,
		scaleMode: ZOOM_SHARED_OPTIONS.scaleMode,
	} as const;

	const resolvedPair =
		effectiveTag === resolvedTag
			? liveResolvedPair
			: BoundStore.resolveTransitionPair(effectiveTag, {
					currentScreenKey: currentRouteKey,
					previousScreenKey: previousRouteKey,
					nextScreenKey: nextRouteKey,
					entering: isEnteringTransition,
				});

	const sourceBorderRadius = getSourceBorderRadius(resolvedPair);
	const targetBorderRadius = zoomOptions?.borderRadius ?? sourceBorderRadius;
	const sourceVisibilityStyle = {
		[effectiveTag]: VISIBLE_STYLE,
	} satisfies TransitionInterpolatedStyle;
	const focusedContentSlot = props.navigationMaskEnabled
		? NAVIGATION_MASK_CONTAINER_STYLE_ID
		: "content";

	/* --------------------------- Missing Source Guard -------------------------- */

	// Only the focused entering route should be hidden when source bounds are
	// missing. During grouped retargeting, the unfocused/source route can still be
	// styled by the destination interpolator while the new active member is warming
	// up; hiding there blanks the wrong screen.
	if (focused && !resolvedPair.sourceBounds && props.active.entering) {
		return {
			[focusedContentSlot]: HIDDEN_STYLE,
		};
	}

	/* --------------------------- Gesture / Drag Values ------------------------- */

	const normX = props.active.gesture.normX;
	const normY = props.active.gesture.normY;
	const initialDirection = props.active.gesture.direction;
	const isHorizontalDismiss =
		initialDirection === "horizontal" ||
		initialDirection === "horizontal-inverted";
	const isVerticalDismiss =
		initialDirection === "vertical" || initialDirection === "vertical-inverted";

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
	const horizontalDragScale = resolveDragScaleTuple(
		zoomOptions?.horizontalDragScale,
	);
	const verticalDragScale = resolveDragScaleTuple(
		zoomOptions?.verticalDragScale,
	);
	const backgroundScale = resolveBackgroundScale(zoomOptions?.backgroundScale);

	const dragXScale = isHorizontalDismiss
		? resolveDirectionalDragScale({
				normalized: normX,
				dismissDirection:
					initialDirection === "horizontal-inverted" ? "negative" : "positive",
				shrinkMin: horizontalDragScale.shrinkMin,
				growMax: horizontalDragScale.growMax,
				exponent: horizontalDragScale.exponent,
			})
		: IDENTITY_DRAG_SCALE_OUTPUT[0];
	const dragYScale = isVerticalDismiss
		? resolveDirectionalDragScale({
				normalized: normY,
				dismissDirection:
					initialDirection === "vertical-inverted" ? "negative" : "positive",
				shrinkMin: verticalDragScale.shrinkMin,
				growMax: verticalDragScale.growMax,
				exponent: verticalDragScale.exponent,
			})
		: IDENTITY_DRAG_SCALE_OUTPUT[1];
	const dragScale = combineScales(dragXScale, dragYScale);

	/* ----------------------------- Focused Screen ----------------------------- */

	if (focused) {
		const focusedContentTarget = getZoomContentTarget({
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
				target: focusedContentTarget,
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
			? interpolate(progress, [0.6, 1], [0, 1], "clamp")
			: interpolate(progress, [0, 0.5], [0, 1], "clamp");

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
			[focusedContentSlot]: {
				style: focusedContentStyle,
			},
			...sourceVisibilityStyle,
		};

		if (props.navigationMaskEnabled) {
			focusedStyles[NAVIGATION_MASK_ELEMENT_STYLE_ID] = {
				style: props.active.entering
					? {
							width: maskWidth,
							height: maskHeight,
							borderRadius: focusedMaskBorderRadius,
							transform: [
								{ translateX: maskTranslateX },
								{ translateY: maskTranslateY },
								{ scale: dragScale },
							],
						}
					: {},
			};
		}

		return focusedStyles;
	}

	/* ---------------------------- Unfocused Screen ---------------------------- */

	const unfocusedFade = props.active?.closing
		? interpolate(progress, [1.6, 2], [1, 0], "clamp")
		: interpolate(progress, [1, 1.5], [1, 0], "clamp");
	const unfocusedScale = interpolate(
		progress,
		[1, 2],
		[1, backgroundScale],
		"clamp",
	);
	const isUnfocusedIdle = props.active.settled === 1;
	const shouldHideUnfocusedIdle = isUnfocusedIdle;
	const didSourceComponentVisiblyHide =
		!props.active.closing && unfocusedFade <= EPSILON;

	const shouldResetUnfocusedElement =
		!props.active.closing &&
		(props.active.logicallySettled || didSourceComponentVisiblyHide);

	const unfocusedElementTarget = getZoomContentTarget({
		explicitTarget,
		screenLayout,
		anchor: ZOOM_SHARED_OPTIONS.anchor,
		resolvedPair,
	});

	const elementRaw = computeBoundStyles(
		zoomComputeParams,
		{
			...baseRawOptions,
			anchor: resolvedZoomAnchor,
			method: "transform",
			space: "relative",
			target: unfocusedElementTarget,
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
		(typeof unfocusedElementTarget === "object"
			? unfocusedElementTarget.pageX + unfocusedElementTarget.width / 2
			: screenLayout.width / 2);
	const elementCenterY =
		boundTargetCenterY ??
		(typeof unfocusedElementTarget === "object"
			? unfocusedElementTarget.pageY + unfocusedElementTarget.height / 2
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
						translateX: shouldResetUnfocusedElement ? 0 : elementTranslateX,
					},
					{
						translateY: shouldResetUnfocusedElement ? 0 : elementTranslateY,
					},
					{
						scaleX: shouldResetUnfocusedElement ? 1 : elementScaleX,
					},
					{
						scaleY: shouldResetUnfocusedElement ? 1 : elementScaleY,
					},
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
		[effectiveTag]: {
			style: resolvedElementStyle,
		},
	};
}
