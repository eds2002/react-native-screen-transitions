import type {
	BoundsNavigationZoomStyle,
	BoundsNavigationZoomOptions,
	ScreenTransitionConfig,
	ScreenGestureTarget,
	ScreenInterpolationProps,
	TransitionInterpolatedStyle,
	TransitionSlotStyle,
} from "../..";
import {
	NAVIGATION_MASK_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
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
	target: "bound",
	DEBUG: true,
	borderRadius: 36,
};

declare const interpolationProps: ScreenInterpolationProps;

const gestureTarget: ScreenGestureTarget = { ancestor: 2 };

const numericBoundsResult = interpolationProps.bounds({
	id: 42,
});
const zoomInterpolatedStyle: BoundsNavigationZoomStyle =
	interpolationProps.bounds({ id: 42 }).navigation.zoom({
		target: "bound",
	});
const maybeContentHeight = interpolationProps.layouts.content?.height;
const maybeCurrentContentHeight = interpolationProps.current.layouts.content?.height;
const currentSnapIndex = interpolationProps.current.snapIndex;
const nextNameOptions: ScreenTransitionConfig = {
	navigationMaskEnabled: true,
	sheetScrollGestureBehavior: "collapse-only",
};
const initialMountAnimationOptions: ScreenTransitionConfig = {
	experimental_animateOnInitialMount: true,
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
const emptyInterpolatorOptions: ScreenTransitionConfig = {
	screenStyleInterpolator: () => null,
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
		container: NAVIGATION_MASK_CONTAINER_STYLE_ID,
		mask: NAVIGATION_MASK_ELEMENT_STYLE_ID,
	},
	slotStyle,
	nestedInterpolatedStyle,
	legacyInterpolatedStyle,
	gestureTarget,
	numericBoundsResult,
	zoomInterpolatedStyle,
	maybeContentHeight,
	maybeCurrentContentHeight,
	currentSnapIndex,
	zoomOptions,
	nextNameOptions,
	initialMountAnimationOptions,
	deprecatedAliasOptions,
	precedenceOptions,
	emptyInterpolatorOptions,
	blankStackFactoryOptions,
	defaultBlankStack,
	viewBlankStack,
	independentBlankStack,
	independentViewBlankStack,
};
