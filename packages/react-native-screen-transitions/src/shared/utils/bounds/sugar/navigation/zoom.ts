import { interpolate } from "react-native-reanimated";
import {
	NAVIGATION_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_HOST_FLAG_STYLE_ID,
	NAVIGATION_MASK_STYLE_ID,
} from "../../../../constants";
import { BoundStore } from "../../../../stores/bounds.store";
import type { TransitionInterpolatedStyle } from "../../../../types/animation.types";
import type { BoundsOptions } from "../../types/options";
import {
	getClosingFade,
	NO_NAVIGATION_STYLE,
	resolveNavigationConfig,
	toNumber,
} from "./helpers";
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
	screenLayout: BuildNavigationStylesParams["screenLayout"];
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
	focused,
	progress,
	currentProgress,
	currentRouteKey,
	screenLayout,
	activeClosing,
	activeGestureX,
	activeGestureY,
	resolveTag,
	computeRaw,
}: BuildNavigationStylesParams): TransitionInterpolatedStyle => {
	"worklet";

	const resolvedConfig = resolveNavigationConfig({
		id,
		group,
		navigationOptions,
		currentRouteKey,
		resolveTag,
		defaultAnchor: "top",
	});
	if (!resolvedConfig) return NO_NAVIGATION_STYLE;

	const { resolvedTag, sharedOptions, explicitTarget } = resolvedConfig;

	const contentTarget = getZoomContentTarget({
		explicitTarget,
		resolvedTag,
		currentRouteKey,
		screenLayout,
	});

	const elementRaw = computeRaw({
		...sharedOptions,
		method: "transform",
		space: "relative",
		target: contentTarget,
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

	const isClosing = activeClosing !== 0;
	const focusedFade = getClosingFade(currentProgress, isClosing);
	const unfocusedScale = interpolate(progress, [1, 2], [1, 0.95], "clamp");
	const gestureX = activeGestureX;
	const gestureY = activeGestureY;
	const rawMaskWidth = toNumber(maskRaw.width);
	const rawMaskHeight = toNumber(maskRaw.height);
	const maskWidth = Math.max(1, rawMaskWidth);
	const maskHeight = Math.max(1, rawMaskHeight);

	if (focused) {
		return {
			[NAVIGATION_MASK_HOST_FLAG_STYLE_ID]: {},
			[NAVIGATION_CONTAINER_STYLE_ID]: {
				opacity: focusedFade,
				transform: [
					{ translateX: toNumber(contentRaw.translateX) + gestureX },
					{ translateY: toNumber(contentRaw.translateY) + gestureY },
					{ scale: toNumber(contentRaw.scale, 1) },
				],
			},
			[NAVIGATION_MASK_STYLE_ID]: {
				width: maskWidth,
				height: maskHeight,
				transform: [
					{ translateX: toNumber(maskRaw.translateX) + gestureX },
					{ translateY: toNumber(maskRaw.translateY) + gestureY },
				],
				borderRadius: toNumber(navigationOptions?.maskBorderRadius, 0),
			},
		};
	}

	return {
		contentStyle: {
			transform: [{ scale: unfocusedScale }],
		},
		[resolvedTag]: {
			transform: [
				{ translateX: toNumber(elementRaw.translateX) + gestureX },
				{ translateY: toNumber(elementRaw.translateY) + gestureY },
				{ scaleX: toNumber(elementRaw.scaleX, 1) },
				{ scaleY: toNumber(elementRaw.scaleY, 1) },
			],
		},
	};
};
