import type { ComponentProps } from "react";
import {
	type BlankStackFactoryOptions,
	type BlankStackNavigationOptions,
	type BlankStackScreenProps,
	createBlankStackNavigator,
} from "../../blank-stack";
import type {
	BoundsNavigationZoomOptions,
	BoundsNavigationZoomStyle,
	ScreenGestureTarget,
	ScreenInterpolationProps,
	ScreenTransitionConfig,
	TransitionInterpolatedStyle,
	TransitionSlotStyle,
} from "..";
import {
	NAVIGATION_MASK_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
} from "..";

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

const zoomOptions: BoundsNavigationZoomOptions = {
	target: "bound",
	debug: true,
	borderRadius: 36,
	focusedElementOpacity: {
		open: [0, 0.35, 0, 1],
		close: [0.65, 1, 0, 1],
	},
	unfocusedElementOpacity: {
		open: [1, 2, 1, 0],
		close: [1.85, 2, 1, 0],
	},
	backgroundScale: 0.97,
	horizontalDragScale: [0.9, 1.02, 2],
	verticalDragScale: [0.96, 1.01, 2.25],
	horizontalDragTranslation: [0.5, 1, 1.5],
	verticalDragTranslation: [0, 0, 1],
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
const zoomInterpolatedStyle: BoundsNavigationZoomStyle = interpolationProps
	.bounds({ id: 42 })
	.navigation.zoom({
		target: "bound",
	});
const absoluteRawBoundsWidth: number = absoluteRawBoundsResult.width;
const absoluteRawBoundsTranslateX: number = absoluteRawBoundsResult.translateX;
const maybeContentHeight = interpolationProps.layouts.content?.height;
const maybeCurrentContentHeight =
	interpolationProps.current.layouts.content?.height;
const currentSnapIndex = interpolationProps.current.snapIndex;
const nextNameOptions: ScreenTransitionConfig = {
	navigationMaskEnabled: true,
	sheetScrollGestureBehavior: "collapse-only",
};
const initialMountAnimationOptions: ScreenTransitionConfig = {
	experimental_animateOnInitialMount: true,
};
const emptyInterpolatorOptions: ScreenTransitionConfig = {
	screenStyleInterpolator: () => null,
};

const blankStackFactoryOptions: BlankStackFactoryOptions = {
	independent: true,
	enableNativeScreens: false,
};
const blankStackNavigationOptions: BlankStackNavigationOptions = {
	inactiveBehavior: "unmount",
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
const staticViewBlankStack =
	createBlankStackNavigator<StaticBlankStackParamList>({
		initialRouteName: "Home",
		enableNativeScreens: false,
		screens: {
			Home: StaticBlankHomeScreen,
			Details: StaticBlankDetailsScreen,
		},
	});

const publicApiTypecheck = {
	navigationSlots: {
		container: NAVIGATION_MASK_CONTAINER_STYLE_ID,
		mask: NAVIGATION_MASK_ELEMENT_STYLE_ID,
	},
	slotStyle,
	nestedInterpolatedStyle,
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
	emptyInterpolatorOptions,
	blankStackFactoryOptions,
	blankStackNavigationOptions,
	viewBlankStackProps,
	independentBlankStackProps,
	independentViewBlankStackProps,
	staticBlankStack,
	staticViewBlankStack,
};

void publicApiTypecheck;
