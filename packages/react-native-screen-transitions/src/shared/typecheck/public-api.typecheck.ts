import {
	createNativeStackNavigator,
	type NativeStackNavigationOptions,
} from "@react-navigation/native-stack";
import type { ComponentProps } from "react";
import type { DerivedValue, SharedValue } from "react-native-reanimated";
import {
	type BlankStackFactoryOptions,
	type BlankStackNavigationOptions,
	type BlankStackScreenProps,
	createBlankStackNavigator,
} from "../../blank-stack";
import type {
	BoundsMotion,
	BoundsNavigationRevealStyle,
	BoundsNavigationZoomOptions,
	BoundsNavigationZoomStyle,
	GestureHandoffValues,
	NativeStackAdapterOptions,
	RawGestureValues,
	ScreenAnimationTarget,
	ScreenGestureTarget,
	ScreenInterpolationProps,
	ScreenTransitionConfig,
	ScreenTransitionDepthTarget,
	ScreenTransitionTarget,
	ScrollGestureAxis,
	ScrollGestureAxisState,
	ScrollGestureState,
	ScrollMetadataState,
	TransitionInterpolatedStyle,
	TransitionSlotStyle,
} from "..";
import {
	NAVIGATION_MASK_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
	useScreenAnimation,
	useScreenGesture,
	withScreenTransitions,
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
	maxSensitivity: 0.6,
	velocityDepth: 0.35,
	gestureProgressMode: "freeform",
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

const scopedBounds = interpolationProps.bounds({ id: 42 });
const tagScopedBounds = interpolationProps.bounds("group:hero");
const numericBoundsResult = scopedBounds.styles();
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
const offsetBoundsResult = scopedBounds.styles({
	offset: { x: 10, y: -10 },
});
const boundsMotion: BoundsMotion = ({ current, progress, props, start }) => {
	"worklet";
	const velocityDip = props.active.gesture.velocity * 0.1;
	const screenBias =
		((start.pageX + start.width / 2) / props.layouts.screen.width) * 2 - 1;
	return {
		x: current.x,
		y: current.y - Math.sin(progress * Math.PI) * 24,
		scale: current.scale * (1 - velocityDip),
		rotate: screenBias * 4,
		rotateY: screenBias * 30,
		perspective: 800,
		transformOrigin: "center",
	};
};
const motionBoundsResult = scopedBounds.styles({
	motion: boundsMotion,
});
const deprecatedGesturesBoundsResult = scopedBounds.styles({
	gestures: { x: 10, y: -10 },
});
const absoluteRawBoundsResult = scopedBounds.math({
	method: "size",
	space: "absolute",
	progress: interpolationProps.current.transitionProgress,
});
const motionRawBoundsResult = scopedBounds.math({
	method: "content",
	motion: boundsMotion,
	progress: interpolationProps.current.transitionProgress,
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
const configuredRevealInterpolatedStyle: BoundsNavigationRevealStyle =
	interpolationProps.bounds({ id: 42 }).navigation.reveal({
		borderRadius: 48,
		borderContinuous: true,
		maxSensitivity: 0.6,
		velocityDepth: 0.35,
		gestureProgressMode: "freeform",
		backgroundScale: 0.96,
		shouldBackgroundScaleResetOnSettled: true,
		disablePointerEventsTillElementTransition: false,
		maskSizingMode: "size",
	});
void configuredRevealInterpolatedStyle;
const currentLink = scopedBounds.link();
const tagCurrentLink = tagScopedBounds.link();
const tagOverrideLink = tagScopedBounds.link("other-group:other-hero");
const currentLinkStatus = currentLink?.status;
const initialSourceBounds = currentLink?.initialSource?.bounds;
const initialDestinationBounds = currentLink?.initialDestination?.bounds;
const scopedCurrentLink = scopedBounds.link();
void currentLink;
void tagCurrentLink;
void tagOverrideLink;
void currentLinkStatus;
void initialSourceBounds;
void initialDestinationBounds;
void scopedCurrentLink;
void numericBoundsResult;
void offsetBoundsResult;
void motionBoundsResult;
void deprecatedGesturesBoundsResult;
void absoluteRawBoundsResult;
void motionRawBoundsResult;
const absoluteRawBoundsWidth: number = absoluteRawBoundsResult.width;
const absoluteRawBoundsTranslateX: number = absoluteRawBoundsResult.translateX;
const motionRawBoundsScale: number = motionRawBoundsResult.scale;
const motionRawBoundsRotate: number = motionRawBoundsResult.rotate;
const motionRawBoundsRotateY: number = motionRawBoundsResult.rotateY;
void motionRawBoundsScale;
void motionRawBoundsRotate;
void motionRawBoundsRotateY;
const maybeContentHeight = interpolationProps.layouts.content?.height;
const maybeCurrentContentHeight =
	interpolationProps.current.layouts.content?.height;
const scrollAxis: ScrollGestureAxis = "vertical";
const scrollAxisState: ScrollGestureAxisState = {
	offset: 0,
	contentSize: 100,
	layoutSize: 80,
	isTouched: false,
};
const scrollState: ScrollGestureState = {
	vertical: scrollAxisState,
	horizontal: scrollAxisState,
};
const scrollMetadataState: ScrollMetadataState = {
	vertical: scrollAxisState,
	horizontal: null,
};
const maybeScrollOffset: number | undefined =
	interpolationProps.current.layouts.scroll?.vertical?.offset;
const currentTransitionProgress: number =
	interpolationProps.current.transitionProgress;
const currentActiveGesture = interpolationProps.current.gesture.active;
const currentRawGestureNormX = interpolationProps.current.gesture.raw.normX;
const currentGestureVelocity: number =
	interpolationProps.current.gesture.velocity;
const currentGestureHandoffNormX: number =
	interpolationProps.current.gesture.handoff.normX;
const currentGestureHandoffRawNormX: number =
	interpolationProps.current.gesture.handoff.raw.normX;
const currentGestureHandoff: GestureHandoffValues =
	interpolationProps.current.gesture.handoff;
const currentRawGesture: RawGestureValues =
	interpolationProps.current.gesture.raw;
const currentGestureRotation: number =
	interpolationProps.current.gesture.rotation;
const currentRawGestureRotation: number =
	interpolationProps.current.gesture.raw.rotation;
const currentAnimatedSnapIndex = interpolationProps.current.animatedSnapIndex;
const currentSnapIndex = interpolationProps.current.snapIndex;
void maybeScrollOffset;
void currentTransitionProgress;
void currentGestureHandoffNormX;
void currentGestureHandoffRawNormX;
void currentGestureHandoff;
void currentRawGesture;
const optionsInterpolatedStyle: TransitionInterpolatedStyle = {
	options: {
		gestureSensitivity: 0.5,
		gestureSnapLocked: true,
		gestureReleaseVelocityScale: 1.2,
	},
};
const invalidMaskRuntimeOptions: TransitionInterpolatedStyle = {
	options: {
		// @ts-expect-error navigationMaskEnabled must be configured as a static screen option.
		navigationMaskEnabled: true,
	},
};
const invalidGestureTrackingRuntimeOptions: TransitionInterpolatedStyle = {
	options: {
		// @ts-expect-error gestureTracking participates in gesture ownership and must be static.
		gestureTracking: "always",
	},
};
void currentRawGestureNormX;
void currentGestureVelocity;
void currentGestureRotation;
void currentRawGestureRotation;
void currentActiveGesture;
void currentAnimatedSnapIndex;
void currentSnapIndex;
void optionsInterpolatedStyle;
void invalidMaskRuntimeOptions;
void invalidGestureTrackingRuntimeOptions;
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
	gestureTracking: "always",
};
const scopedGestureDirectionOptions: ScreenTransitionConfig = {
	gestureDirection: [
		{ gesture: "vertical", area: "edge" },
		{ gesture: "horizontal", area: 32 },
		{ gesture: "pinch-in", area: "screen" },
	],
};
const emptyInterpolatorOptions: ScreenTransitionConfig = {
	screenStyleInterpolator: () => null,
};

type NativeStackAdapterParamList = {
	Profile: undefined;
	Avatar: { id: string };
};

const NativeStack = createNativeStackNavigator<NativeStackAdapterParamList>();
const TransitionNativeStack = withScreenTransitions(NativeStack);
const nativeStackAdapterOptions: NativeStackAdapterOptions<NativeStackNavigationOptions> =
	{
		enableTransitions: true,
		gestureEnabled: true,
		gestureDirection: "bidirectional",
	};
function NativeStackAdapterProfileScreen() {
	return null;
}
const nativeStackAdapterScreen = TransitionNativeStack.Screen({
	name: "Profile",
	getComponent: () => NativeStackAdapterProfileScreen,
	options: nativeStackAdapterOptions,
});
void TransitionNativeStack;
void nativeStackAdapterOptions;
void nativeStackAdapterScreen;

const blankStackFactoryOptions: BlankStackFactoryOptions = {
	independent: true,
};
const blankStackNavigationOptions: BlankStackNavigationOptions = {};

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
	parentTransition,
	grandparentTransition,
	selfTransition,
	childTransition,
	grandchildTransition,
	rootTransitionBounds,
	leafTransitionBounds,
	numericBoundsResult,
	offsetBoundsResult,
	deprecatedGesturesBoundsResult,
	absoluteRawBoundsResult,
	absoluteRawBoundsWidth,
	absoluteRawBoundsTranslateX,
	zoomInterpolatedStyle,
	maybeContentHeight,
	maybeCurrentContentHeight,
	scrollAxis,
	scrollState,
	scrollMetadataState,
	maybeScrollOffset,
	currentActiveGesture,
	currentSnapIndex,
	zoomOptions,
	navigationMaskInterpolatedStyle,
	nextNameOptions,
	sharedGestureSensitivityOptions,
	initialMountAnimationOptions,
	disabledGestureTrackingOptions,
	scopedGestureDirectionOptions,
	emptyInterpolatorOptions,
	blankStackFactoryOptions,
	blankStackNavigationOptions,
	independentBlankStackProps,
	staticBlankStack,
};

void publicApiTypecheck;
