import type { ComponentProps } from "react";
import type { DerivedValue, SharedValue } from "react-native-reanimated";
import {
	type BlankStackFactoryOptions,
	type BlankStackNavigationOptions,
	type BlankStackScreenProps,
	createBlankStackNavigator,
} from "../../blank-stack";
import type {
	BoundsNavigationRevealStyle,
	BoundsNavigationZoomOptions,
	BoundsNavigationZoomStyle,
	ScreenAnimationTarget,
	ScreenGestureTarget,
	ScreenInterpolationProps,
	ScreenTransitionConfig,
	ScreenTransitionDepthTarget,
	ScreenTransitionTarget,
	TransitionInterpolatedStyle,
	TransitionSlotStyle,
} from "..";
import {
	NAVIGATION_MASK_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
	useScreenAnimation,
	useScreenGesture,
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

const navigationMaskInterpolatedStyle: TransitionInterpolatedStyle = {
	[NAVIGATION_MASK_CONTAINER_STYLE_ID]: slotStyle,
	[NAVIGATION_MASK_ELEMENT_STYLE_ID]: slotStyle,
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

const gestureTarget: ScreenGestureTarget = { depth: -2 };
const animationTarget: ScreenAnimationTarget = { depth: -2 };
const legacyAnimationTarget: ScreenAnimationTarget = { ancestor: 2 };
const transitionTarget: ScreenTransitionTarget = { depth: 2 };
const transitionDepthTarget: ScreenTransitionDepthTarget = { depth: 0 };

function usePublicApiHooksTypecheck() {
	const selfAnimation: DerivedValue<ScreenInterpolationProps> =
		useScreenAnimation();
	const selfTargetAnimation: DerivedValue<ScreenInterpolationProps> =
		useScreenAnimation({ depth: 0 });
	const ancestorAnimation: DerivedValue<ScreenInterpolationProps | null> =
		useScreenAnimation({ depth: -1 });
	const childAnimation: DerivedValue<ScreenInterpolationProps | null> =
		useScreenAnimation({ depth: 1 });
	const legacySelfAnimation: DerivedValue<ScreenInterpolationProps> =
		useScreenAnimation("self");
	const legacyParentAnimation: DerivedValue<ScreenInterpolationProps | null> =
		useScreenAnimation("parent");
	const legacyRootAnimation: DerivedValue<ScreenInterpolationProps | null> =
		useScreenAnimation("root");
	const legacyAncestorAnimation: DerivedValue<ScreenInterpolationProps | null> =
		useScreenAnimation({ ancestor: 2 });
	const inheritedGesture = useScreenGesture();
	const ancestorGesture = useScreenGesture({ depth: -1 });

	return {
		selfAnimation,
		selfTargetAnimation,
		ancestorAnimation,
		childAnimation,
		legacySelfAnimation,
		legacyParentAnimation,
		legacyRootAnimation,
		legacyAncestorAnimation,
		inheritedGesture,
		ancestorGesture,
	};
}

void usePublicApiHooksTypecheck;
void legacyAnimationTarget;
void transitionTarget;
void transitionDepthTarget;

const numericBoundsResult = interpolationProps.bounds({
	id: 42,
});
const parentTransition = interpolationProps.transition({ depth: -1 });
const grandparentTransition = interpolationProps.transition({ depth: -2 });
const selfTransition = interpolationProps.transition({ depth: 0 });
const childTransition = interpolationProps.transition({ depth: 1 });
const grandchildTransition = interpolationProps.transition({ depth: 2 });
const rootTransitionBounds = interpolationProps
	.transition({ depth: -2 })
	?.bounds({ id: 42 });
const leafTransitionBounds = interpolationProps
	.transition({ depth: 2 })
	?.bounds({ id: 42 });
const offsetBoundsResult = interpolationProps.bounds({
	id: 42,
	offset: { x: 10, y: -10 },
});
const deprecatedGesturesBoundsResult = interpolationProps.bounds({
	id: 42,
	gestures: { x: 10, y: -10 },
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
const revealInterpolatedStyle: BoundsNavigationRevealStyle = interpolationProps
	.bounds({ id: 42 })
	.navigation.reveal();
void revealInterpolatedStyle;
const currentLink = interpolationProps.bounds.getLink(42);
const initialSource = currentLink?.initialSource;
const initialDestination = currentLink?.initialDestination;
const scopedBounds = interpolationProps.bounds({ id: 42 });
const scopedCurrentLink = scopedBounds.getLink();
const scopedLinkRawSize = scopedCurrentLink?.compute({
	method: "size",
	space: "absolute",
	target: "fullscreen",
	raw: true,
});
const scopedMeasured = scopedBounds.getMeasured("screen-key");
const scopedInitialSnapshot = scopedBounds.getSnapshot("screen-key");
const scopedInterpolatedStyle: number =
	scopedBounds.interpolateStyle("opacity");
const scopedInterpolatedBounds: number =
	scopedBounds.interpolateBounds("pageX");
void currentLink;
void initialSource;
void initialDestination;
void parentTransition;
void grandparentTransition;
void selfTransition;
void childTransition;
void grandchildTransition;
void rootTransitionBounds;
void leafTransitionBounds;
void scopedCurrentLink;
void scopedLinkRawSize;
void scopedMeasured;
void scopedInitialSnapshot;
void scopedInterpolatedStyle;
void scopedInterpolatedBounds;
const absoluteRawBoundsWidth: number = absoluteRawBoundsResult.width;
const absoluteRawBoundsTranslateX: number = absoluteRawBoundsResult.translateX;
const maybeContentHeight = interpolationProps.layouts.content?.height;
const maybeCurrentContentHeight =
	interpolationProps.current.layouts.content?.height;
const currentActiveGesture = interpolationProps.current.gesture.active;
const currentRawGestureNormX = interpolationProps.current.gesture.raw.normX;
const currentAnimatedSnapIndex = interpolationProps.current.animatedSnapIndex;
const currentSnapIndex = interpolationProps.current.snapIndex;
const optionsInterpolatedStyle: TransitionInterpolatedStyle = {
	options: {
		gestureSensitivity: 0.5,
		gestureSnapLocked: true,
		gestureReleaseVelocityScale: 1.2,
	},
};
void currentRawGestureNormX;
void currentActiveGesture;
void currentAnimatedSnapIndex;
void currentSnapIndex;
void optionsInterpolatedStyle;
const nextNameOptions: ScreenTransitionConfig = {
	navigationMaskEnabled: true,
	sheetScrollGestureBehavior: "collapse-only",
	gestureSensitivity: 0.75,
};
declare const gestureSensitivitySharedValue: SharedValue<number>;
const sharedGestureSensitivityOptions: ScreenTransitionConfig = {
	// @ts-expect-error Dynamic gesture sensitivity belongs in screenStyleInterpolator options.
	gestureSensitivity: gestureSensitivitySharedValue,
};
const initialMountAnimationOptions: ScreenTransitionConfig = {
	experimental_animateOnInitialMount: true,
};
const disabledGestureTrackingOptions: ScreenTransitionConfig = {
	gestureEnabled: false,
	experimental_allowDisabledGestureTracking: true,
};
const emptyInterpolatorOptions: ScreenTransitionConfig = {
	screenStyleInterpolator: () => null,
};

const blankStackFactoryOptions: BlankStackFactoryOptions = {
	independent: true,
};
const blankStackNavigationOptions: BlankStackNavigationOptions = {
	freezeOnBlur: true,
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
const independentBlankStackProps: Pick<
	DefaultBlankStackNavigatorProps,
	"independent"
> = {
	independent: true,
};
const staticBlankStack = createBlankStackNavigator<StaticBlankStackParamList>({
	initialRouteName: "Home",
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
	animationTarget,
	numericBoundsResult,
	offsetBoundsResult,
	deprecatedGesturesBoundsResult,
	absoluteRawBoundsResult,
	absoluteRawBoundsWidth,
	absoluteRawBoundsTranslateX,
	zoomInterpolatedStyle,
	maybeContentHeight,
	maybeCurrentContentHeight,
	currentActiveGesture,
	currentSnapIndex,
	zoomOptions,
	navigationMaskInterpolatedStyle,
	nextNameOptions,
	sharedGestureSensitivityOptions,
	initialMountAnimationOptions,
	disabledGestureTrackingOptions,
	emptyInterpolatorOptions,
	blankStackFactoryOptions,
	blankStackNavigationOptions,
	independentBlankStackProps,
	staticBlankStack,
};

void publicApiTypecheck;
