import type {
	BoundsNavigationZoomOptions,
	ScreenTransitionConfig,
	ScreenGestureTarget,
	ScreenInterpolationProps,
	TransitionInterpolatedStyle,
	TransitionSlotStyle,
} from "../..";
import {
	NAVIGATION_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_STYLE_ID,
} from "../..";
import {
	createBlankStackNavigator,
	type BlankStackFactoryOptions,
} from "../../../blank-stack";

const slotStyle: TransitionSlotStyle = {
	style: {
		opacity: 1,
	},
	props: {
		intensity: 80,
	},
};

const nestedInterpolatedStyle: TransitionInterpolatedStyle = {
	content: slotStyle,
	backdrop: {
		opacity: 0.5,
	},
	surface: {
		style: {
			transform: [{ scale: 0.98 }],
		},
	},
	"hero-image": {
		style: {
			borderRadius: 24,
		},
	},
};

const legacyInterpolatedStyle: TransitionInterpolatedStyle = {
	contentStyle: {
		opacity: 1,
	},
	backdropStyle: {
		opacity: 0.5,
	},
	overlayStyle: {
		opacity: 0.25,
	},
};

const zoomOptions: BoundsNavigationZoomOptions = {
	mask: {
		borderRadius: { from: 24, to: 0 },
		borderTopLeftRadius: "auto",
		borderCurve: "continuous",
		outset: { bottom: 16 },
	},
	motion: {
		dragResistance: 0.32,
		dragDirectionalScaleMin: 0.2,
	},
};

declare const interpolationProps: ScreenInterpolationProps;

const gestureTarget: ScreenGestureTarget = { ancestor: 2 };

const numericBoundsResult = interpolationProps.bounds({
	id: 42,
});
const maybeContentHeight = interpolationProps.layouts.content?.height;
const nextNameOptions: ScreenTransitionConfig = {
	navigationMaskEnabled: true,
	sheetScrollGestureBehavior: "collapse-only",
};
const deprecatedAliasOptions: ScreenTransitionConfig = {
	maskEnabled: true,
	expandViaScrollView: false,
};
const precedenceOptions: ScreenTransitionConfig = {
	navigationMaskEnabled: false,
	maskEnabled: true,
	sheetScrollGestureBehavior: "expand-and-collapse",
	expandViaScrollView: false,
};

const blankStackFactoryOptions: BlankStackFactoryOptions = {
	independent: true,
	enableNativeScreens: false,
};

const defaultBlankStack = createBlankStackNavigator();
const viewBlankStack = createBlankStackNavigator({
	enableNativeScreens: false,
});
const independentBlankStack = createBlankStackNavigator({
	independent: true,
});
const independentViewBlankStack = createBlankStackNavigator({
	independent: true,
	enableNativeScreens: false,
});

export const publicApiTypecheck = {
	navigationSlots: {
		container: NAVIGATION_CONTAINER_STYLE_ID,
		mask: NAVIGATION_MASK_STYLE_ID,
	},
	slotStyle,
	nestedInterpolatedStyle,
	legacyInterpolatedStyle,
	gestureTarget,
	numericBoundsResult,
	maybeContentHeight,
	zoomOptions,
	nextNameOptions,
	deprecatedAliasOptions,
	precedenceOptions,
	blankStackFactoryOptions,
	defaultBlankStack,
	viewBlankStack,
	independentBlankStack,
	independentViewBlankStack,
};
