import type { ComponentProps } from "react";
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
	type BlankStackScreenProps,
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
	debug: true,
	borderRadius: 36,
	backgroundScale: 0.97,
	horizontalDragScale: [0.9, 1.02, 2],
	verticalDragScale: [0.96, 1.01, 2.25],
};

declare const interpolationProps: ScreenInterpolationProps;

const gestureTarget: ScreenGestureTarget = { ancestor: 2 };

const numericBoundsResult = interpolationProps.bounds({
	id: 42,
});
const absoluteRawBoundsResult = interpolationProps.bounds({
	id: 42,
	method: "size",
	space: "absolute",
	raw: true,
});
const zoomInterpolatedStyle: BoundsNavigationZoomStyle =
	interpolationProps.bounds({ id: 42 }).navigation.zoom({
		target: "bound",
	});
const absoluteRawBoundsWidth: number = absoluteRawBoundsResult.width;
const absoluteRawBoundsTranslateX: number = absoluteRawBoundsResult.translateX;
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

type StaticBlankStackParamList = {
	Home: undefined;
	Details: { id: string };
};

function StaticBlankHomeScreen(
	_props: BlankStackScreenProps<StaticBlankStackParamList, "Home">,
) {
	return null;
}

function StaticBlankDetailsScreen(
	_props: BlankStackScreenProps<StaticBlankStackParamList, "Details">,
) {
	return null;
}

const defaultBlankStack = createBlankStackNavigator();
type DefaultBlankStackNavigatorProps = ComponentProps<
	typeof defaultBlankStack.Navigator
>;
const viewBlankStackProps: Pick<
	DefaultBlankStackNavigatorProps,
	"enableNativeScreens"
> = {
	enableNativeScreens: false,
};
const independentBlankStackProps: Pick<
	DefaultBlankStackNavigatorProps,
	"independent"
> = {
	independent: true,
};
const independentViewBlankStackProps: Pick<
	DefaultBlankStackNavigatorProps,
	"independent" | "enableNativeScreens"
> = {
	independent: true,
	enableNativeScreens: false,
};
const staticBlankStack = createBlankStackNavigator<StaticBlankStackParamList>({
	initialRouteName: "Home",
	screens: {
		Home: StaticBlankHomeScreen,
		Details: StaticBlankDetailsScreen,
	},
});
const staticViewBlankStack = createBlankStackNavigator<StaticBlankStackParamList>({
	initialRouteName: "Home",
	enableNativeScreens: false,
	screens: {
		Home: StaticBlankHomeScreen,
		Details: StaticBlankDetailsScreen,
	},
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
	absoluteRawBoundsResult,
	absoluteRawBoundsWidth,
	absoluteRawBoundsTranslateX,
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
	viewBlankStackProps,
	independentBlankStackProps,
	independentViewBlankStackProps,
};
