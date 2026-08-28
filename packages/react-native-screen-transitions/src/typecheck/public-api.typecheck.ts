import type {
	NavigationState,
	NavigatorTypeBagBase,
	TypedNavigator,
} from "@react-navigation/native";
import type { DerivedValue, SharedValue } from "react-native-reanimated";
import type Transition from "..";
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
	ScreenSurfaceComponent,
	ScreenSurfaceComponentProps,
	ScreenTransitionConfig,
	ScreenTransitionDepthTarget,
	ScreenTransitionTarget,
	ScrollGestureAxis,
	ScrollGestureAxisState,
	ScrollGestureState,
	ScrollMetadataState,
	TransitionInterpolatedStyle,
	TransitionSlotStyle,
	TransitionSpec,
} from "..";
import {
	NAVIGATION_MASK_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
	useScreenAnimation,
	useScreenGesture,
	withScreenTransitions,
} from "..";
import {
	type BlankStackNavigationOptions,
	type BlankStackOverlayProps,
	type BlankStackScreenProps,
	createBlankStackNavigator,
} from "../navigators/react-navigation";

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
	surface: slotStyle,
	backdrop: {
		opacity: 0.5,
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
	borderRadius: 36,
	backgroundScale: 0.97,
};
declare const zoomTransitionSpec: typeof Transition.Specs.Zoom;
const typedZoomTransitionSpec: TransitionSpec = zoomTransitionSpec;

declare const interpolationProps: ScreenInterpolationProps;

const gestureTarget: ScreenGestureTarget = { depth: -2 };
const animationTarget: ScreenAnimationTarget = { depth: -2 };
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
	const keyedAnimation: DerivedValue<ScreenInterpolationProps | null> =
		useScreenAnimation("feed");
	const inheritedGesture = useScreenGesture();
	const ancestorGesture = useScreenGesture({ depth: -1 });

	return {
		selfAnimation,
		selfTargetAnimation,
		ancestorAnimation,
		childAnimation,
		keyedAnimation,
		inheritedGesture,
		ancestorGesture,
	};
}

void usePublicApiHooksTypecheck;
void transitionTarget;
void transitionDepthTarget;

const scopedBounds = interpolationProps.bounds({ id: 42 });
const tagScopedBounds = interpolationProps.bounds("group:hero");
const numericBoundsResult = scopedBounds.styles();
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
const absoluteRawBoundsResult = scopedBounds.values({
	method: "size",
	space: "absolute",
	progress: interpolationProps.current.transitionProgress,
});
const motionRawBoundsResult = scopedBounds.values({
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
const currentGestureInitiator = interpolationProps.current.gesture.initiator;
// @ts-expect-error v4 exposes the live gesture identity through `initiator`.
interpolationProps.current.gesture.active;
// @ts-expect-error v4 no longer exposes the pan-only gesture direction alias.
interpolationProps.current.gesture.direction;
const currentRawGestureNormX = interpolationProps.current.gesture.raw.normX;
const currentGestureVelocity: number =
	interpolationProps.current.gesture.velocity;
const currentGestureHandoffNormX: number =
	interpolationProps.current.gesture.handoff.normX;
const currentGestureHandoffRawNormX: number =
	interpolationProps.current.gesture.handoff.raw.normX;
const currentGestureHandoff: GestureHandoffValues =
	interpolationProps.current.gesture.handoff;
// @ts-expect-error v4 exposes the captured identity through `handoff.active`.
interpolationProps.current.gesture.handoff.direction;
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
void currentGestureInitiator;
void currentAnimatedSnapIndex;
void currentSnapIndex;
void optionsInterpolatedStyle;
void invalidMaskRuntimeOptions;
void invalidGestureTrackingRuntimeOptions;
const nextNameOptions: ScreenTransitionConfig = {
	navigationMaskEnabled: true,
	sheetSnapBehavior: "step",
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
declare const surfaceComponent: ScreenSurfaceComponent;
declare const surfaceComponentProps: ScreenSurfaceComponentProps;
const surfaceOptions: ScreenTransitionConfig = {
	surfaceComponent,
};
void surfaceComponentProps;
void surfaceOptions;

type NativeStackAdapterParamList = {
	Profile: undefined;
	Avatar: { id: string };
};

type ExternalNativeStackOptions = {
	gestureEnabled?: boolean;
	gestureDirection?: "horizontal" | "vertical" | "bidirectional";
	title?: string;
};

type ExternalNativeStackTypeBag = NavigatorTypeBagBase & {
	ParamList: NativeStackAdapterParamList;
	State: NavigationState<NativeStackAdapterParamList>;
	ScreenOptions: ExternalNativeStackOptions;
	NavigationList: {
		[RouteName in keyof NativeStackAdapterParamList]: unknown;
	};
};

declare const NativeStack: TypedNavigator<
	ExternalNativeStackTypeBag,
	undefined
>;
const TransitionNativeStack = withScreenTransitions(NativeStack);
const nativeStackAdapterOptions: NativeStackAdapterOptions<ExternalNativeStackOptions> =
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
	options: nativeStackAdapterOptions as never,
});
void TransitionNativeStack;
void nativeStackAdapterOptions;
void nativeStackAdapterScreen;

const blankStackNavigationOptions: BlankStackNavigationOptions = {};

type OnboardingParamList = {
	Welcome: undefined;
	Profile: { referralCode?: string };
};

declare const welcomeOverlayProps: BlankStackOverlayProps<
	OnboardingParamList,
	"Welcome"
>;

function WelcomeOverlay(
	_props: BlankStackOverlayProps<OnboardingParamList, "Welcome">,
) {
	return null;
}

const welcomeOwnerRouteName: "Welcome" = welcomeOverlayProps.route.name;
const focusedOnboardingRouteName: "Welcome" | "Profile" =
	welcomeOverlayProps.focusedRoute.name;
if (welcomeOverlayProps.focusedRoute.name === "Profile") {
	const referralCode: string | undefined =
		welcomeOverlayProps.focusedRoute.params.referralCode;
	void referralCode;
}
welcomeOverlayProps.navigation.navigate("Profile", { referralCode: "dorsia" });
// @ts-expect-error Unknown routes are rejected by the navigator param list.
welcomeOverlayProps.navigation.navigate("Missing");

const onboardingOptions: BlankStackNavigationOptions = {
	meta: {
		title: "Welcome to Dorsia",
		cta: { label: "Continue" },
	},
	overlay: WelcomeOverlay,
};

void welcomeOwnerRouteName;
void focusedOnboardingRouteName;
void onboardingOptions;
void WelcomeOverlay;

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
const staticBlankStack = createBlankStackNavigator({
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
	currentGestureInitiator,
	currentSnapIndex,
	zoomOptions,
	zoomTransitionSpec,
	typedZoomTransitionSpec,
	navigationMaskInterpolatedStyle,
	nextNameOptions,
	sharedGestureSensitivityOptions,
	initialMountAnimationOptions,
	disabledGestureTrackingOptions,
	scopedGestureDirectionOptions,
	emptyInterpolatorOptions,
	blankStackNavigationOptions,
	defaultBlankStack,
	staticBlankStack,
};

void publicApiTypecheck;
