import {
	NAVIGATION_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_HOST_FLAG_STYLE_ID,
	NAVIGATION_MASK_STYLE_ID,
} from "../../../../constants";
import type { TransitionInterpolatedStyle } from "../../../../types/animation.types";
import {
	getClosingFade,
	NO_NAVIGATION_STYLE,
	resolveNavigationConfig,
	toNumber,
} from "./helpers";
import type { BuildNavigationStylesParams } from "./types";

export const buildHeroNavigationStyles = ({
	id,
	group,
	navigationOptions,
	focused,
	currentProgress,
	currentRouteKey,
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
		defaultAnchor: undefined,
	});
	if (!resolvedConfig) return NO_NAVIGATION_STYLE;

	const { resolvedTag, sharedOptions, explicitTarget } = resolvedConfig;
	const target = explicitTarget ?? "bound";

	const elementRaw = computeRaw({
		...sharedOptions,
		method: "transform",
		space: "relative",
		target,
	});

	const contentRaw = computeRaw({
		...sharedOptions,
		method: "content",
		target,
	});

	const maskRaw = computeRaw({
		...sharedOptions,
		method: "size",
		space: "absolute",
		target: "fullscreen",
	});

	const isClosing = activeClosing !== 0;
	const focusedFade = getClosingFade(currentProgress, isClosing);

	if (focused) {
		return {
			[NAVIGATION_MASK_HOST_FLAG_STYLE_ID]: {},
			[NAVIGATION_CONTAINER_STYLE_ID]: {
				opacity: focusedFade,
				transform: [
					{ translateX: toNumber(contentRaw.translateX) + activeGestureX },
					{ translateY: toNumber(contentRaw.translateY) + activeGestureY },
					{ scale: toNumber(contentRaw.scale, 1) },
				],
			},
			[NAVIGATION_MASK_STYLE_ID]: {
				width: toNumber(maskRaw.width),
				height: toNumber(maskRaw.height),
				transform: [
					{ translateX: toNumber(maskRaw.translateX) + activeGestureX },
					{ translateY: toNumber(maskRaw.translateY) + activeGestureY },
				],
				borderRadius: toNumber(navigationOptions?.maskBorderRadius, 0),
			},
		};
	}

	return {
		contentStyle: undefined,
		[resolvedTag]: {
			transform: [
				{ translateX: toNumber(elementRaw.translateX) },
				{ translateY: toNumber(elementRaw.translateY) },
				{ scaleX: toNumber(elementRaw.scaleX, 1) },
				{ scaleY: toNumber(elementRaw.scaleY, 1) },
			],
		},
	};
};
