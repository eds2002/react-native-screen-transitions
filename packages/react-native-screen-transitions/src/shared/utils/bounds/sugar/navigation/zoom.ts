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
import type { BoundsOptions } from "../../types/options";
import { resolveNavigationConfig, toNumber } from "./helpers";
import type { BuildNavigationStylesParams } from "./types";

const getZoomContentTarget = ({
	explicitTarget,
	resolvedTag,
	currentRouteKey,
	screenLayout,
}: {
	explicitTarget: BoundsOptions["target"] | undefined;
	resolvedTag: string;
	currentRouteKey?: string;
	screenLayout: Layout;
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

	return {
		x: 0,
		y: 0,
		pageX: 0,
		pageY: 0,
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

	const xScaleOuput = initialDirection === "horizontal" ? [1, 0.25] : [1, 1];
	const yScaleOuput = initialDirection === "vertical" ? [1, 0.25] : [1, 1];

	const dragX = interpolate(
		normX,
		[-1, 0, 1],
		[-screenLayout.width * xResistance, 0, screenLayout.width * xResistance],
		"clamp",
	);
	const dragY = interpolate(
		normY,
		[-1, 0, 1],
		[-screenLayout.height * yResistance, 0, screenLayout.height * yResistance],
		"clamp",
	);
	const rawDragXScale = interpolate(normX, [0, 1], xScaleOuput, "clamp");
	const rawDragYScale = interpolate(normY, [0, 1], yScaleOuput, "clamp");
	const dragXScale = rawDragXScale ** 2;
	const dragYScale = rawDragYScale ** 2;

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
		? interpolate(progress, [0.2, 0.5], [0, 1], "clamp")
		: interpolate(progress, [0, 0.3], [0, 1], "clamp");

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
			content: {
				style: {
					opacity: 0.2,
				},
			},
		};
	}

	const safeScale = Math.max(unfocusedScale, EPSILON);
	const dragScale = dragXScale * dragYScale;

	const destCenterY =
		typeof contentTarget === "object"
			? contentTarget.pageY + contentTarget.height / 2
			: screenLayout.height / 2;

	const scaleShiftY = (destCenterY - screenLayout.height / 2) * (dragScale - 1);

	const compensatedGestureX = dragX / safeScale;
	// dragY is measured in screen space and must be unscaled by the parent
	// content shrink, while scaleShiftY is already in the parent's local space.
	const compensatedGestureY = dragY / safeScale + scaleShiftY;

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
			},
		},
	};
};
