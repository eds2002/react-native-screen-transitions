import {
	createNativeStackNavigator,
	type NativeStackNavigationOptions,
} from "@react-navigation/native-stack";
import type { ComponentProps } from "react";
import type { DerivedValue, SharedValue } from "react-native-reanimated";
import {
	type BlankStackFactoryOptions,
	type BlankStackNavigationOptions,
	type BlankStackOverlayProps,
	type BlankStackScreenProps,
	createBlankStackNavigator,
} from "../../blank-stack";
import type { ComponentStackOverlayProps } from "../../component-stack";
import type { NativeStackOverlayProps as LegacyNativeStackOverlayProps } from "../../native-stack";
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
	ScreenBackdropComponentProps,
	ScreenContentComponentProps,
	ScreenGestureTarget,
	ScreenInterpolationProps,
	ScreenStyleInterpolator,
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
	blockTransition,
	NAVIGATION_MASK_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
	unblockTransition,
	useScreenAnimation,
	useScreenGesture,
	withScreenTransitions,
} from "..";

blockTransition();
blockTransition("route-key");
unblockTransition();
unblockTransition("route-key");

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

const passiveBoundaryProps: ComponentProps<typeof Transition.Boundary> = {
	id: "hero",
	handoff: true,
};
const escapedBoundaryProps: ComponentProps<typeof Transition.Boundary> = {
	id: "hero",
	escapeClipping: true,
};
const escapedHandoffBoundaryProps: ComponentProps<typeof Transition.Boundary> =
	{
		id: "hero",
		handoff: true,
		escapeClipping: true,
	};
const pressableBoundaryProps: ComponentProps<typeof Transition.Boundary> = {
	id: "hero",
	onPress: () => {},
};
const removedBoundaryPortalProps: ComponentProps<typeof Transition.Boundary> = {
	id: "hero",
	// @ts-expect-error Boundary uses handoff and escapeClipping instead of the removed portal prop.
	portal: "screen",
};
const deprecatedBoundaryViewProps: ComponentProps<
	typeof Transition.Boundary.View
> = {
	id: "hero",
};
const deprecatedBoundaryTriggerProps: ComponentProps<
	typeof Transition.Boundary.Trigger
> = {
	id: "hero",
	onPress: () => {},
};
void passiveBoundaryProps;
void escapedBoundaryProps;
void escapedHandoffBoundaryProps;
void pressableBoundaryProps;
void removedBoundaryPortalProps;
void deprecatedBoundaryViewProps;
void deprecatedBoundaryTriggerProps;

const zoomOptions: BoundsNavigationZoomOptions = {};
declare const zoomTransitionSpec: typeof Transition.Specs.Zoom;
const typedZoomTransitionSpec: TransitionSpec = zoomTransitionSpec;

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
		keepFocusedVisible: true,
		borderRadius: 36,
		backgroundScale: 0.95,
		backdropColor: "#000000",
		backdropOpacity: 0.4,
		drag: {
			translation: { horizontal: 0.8, vertical: 0.9 },
			scale: { horizontal: 0.7, vertical: 0.85 },
		},
	});
const deprecatedZoomOptions: BoundsNavigationZoomOptions = {
	debug: true,
	focusedElementOpacity: { open: [0, 1, 0, 1] },
	unfocusedElementOpacity: { close: [0, 1, 1, 0] },
	maxSensitivity: 0.8,
	velocityDepth: 0.5,
	gestureProgressMode: "freeform",
	horizontalDragScale: [0.5, 1.1, 2],
	verticalDragScale: [0.5, 1.1, 2],
	horizontalDragTranslation: [0.8, 0.8, 2],
	verticalDragTranslation: [0.8, 0.8, 2],
};
void deprecatedZoomOptions;
interpolationProps.bounds({ id: 42 }).navigation.zoom({
	// @ts-expect-error Zoom targets must resolve to supported bounds geometry.
	target: "viewport",
});
interpolationProps.bounds({ id: 42 }).navigation.zoom({
	// @ts-expect-error Focused visibility is an opt-in boolean.
	keepFocusedVisible: "yes",
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
const renderBackdropOptions: ScreenTransitionConfig = {
	backdropComponent: ({
		styles,
		props,
		pointerEvents,
	}: ScreenBackdropComponentProps) => {
		void styles;
		void props;
		void pointerEvents;
		return null;
	},
};
const renderContentOptions: ScreenTransitionConfig = {
	contentComponent: ({
		styles,
		props,
		pointerEvents,
		children,
	}: ScreenContentComponentProps) => {
		void styles;
		void props;
		void pointerEvents;
		return children;
	},
};
const deprecatedSurfaceComponentOptions: ScreenTransitionConfig = {
	surfaceComponent: () => null,
};
void renderBackdropOptions;
void renderContentOptions;
void deprecatedSurfaceComponentOptions;

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

const onboardingInterpolator: ScreenStyleInterpolator = ({ current }) => {
	"worklet";
	const title: unknown = current.meta?.title;
	void title;
	return {};
};

declare const legacyNativeOverlayProps: LegacyNativeStackOverlayProps<
	OnboardingParamList,
	"Profile"
>;
declare const componentOverlayProps: ComponentStackOverlayProps<
	OnboardingParamList,
	"Profile"
>;
const legacyNativeReferralCode: string | undefined =
	legacyNativeOverlayProps.route.params.referralCode;
const componentOverlayMeta: Record<string, unknown> | undefined =
	componentOverlayProps.meta;

// @ts-expect-error Navigator options do not carry an application metadata schema.
declare const invalidTypedBlankStackOptions: BlankStackNavigationOptions<{
	title: string;
}>;
// @ts-expect-error Interpolator metadata is intentionally accessed as runtime data.
declare const invalidTypedInterpolator: ScreenStyleInterpolator<{
	title: string;
}>;

void welcomeOwnerRouteName;
void focusedOnboardingRouteName;
void onboardingOptions;
void onboardingInterpolator;
void WelcomeOverlay;
void legacyNativeReferralCode;
void componentOverlayMeta;
void invalidTypedBlankStackOptions;
void invalidTypedInterpolator;

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
	zoomTransitionSpec,
	typedZoomTransitionSpec,
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
