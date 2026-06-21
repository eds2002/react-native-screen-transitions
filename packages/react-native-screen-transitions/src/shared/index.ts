import { FlatList, Pressable, ScrollView, View } from "react-native";
import { withScreenTransitions } from "./adapters/with-screen-transitions";
import { Boundary, createBoundaryComponent } from "./components/boundary";
import { createTransitionAwareComponent } from "./components/create-transition-aware-component";
import MaskedView from "./components/masked-view";
import { Presets, Specs } from "./configs";

export default {
	createTransitionAwareComponent,
	createBoundaryComponent,
	withScreenTransitions,
	Boundary,
	View: createTransitionAwareComponent(View),
	Pressable: createTransitionAwareComponent(Pressable),
	ScrollView: createTransitionAwareComponent(ScrollView, {
		isScrollable: true,
	}),
	FlatList: createTransitionAwareComponent(FlatList, {
		isScrollable: true,
	}),
	MaskedView: MaskedView,
	Presets,
	Specs,
};

export type { NativeStackAdapterOptions } from "./adapters/with-screen-transitions";
export { withScreenTransitions } from "./adapters/with-screen-transitions";
export { snapTo } from "./animation/snap-to";
export type {
	BoundaryPortal,
	BoundaryPortalAttachTarget,
	BoundaryPortalOptions,
} from "./components/boundary";
export {
	NAVIGATION_MASK_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
	TRANSFORM_RESET,
} from "./constants";
export { useHistory } from "./hooks/navigation/use-history";
export {
	type ScreenState,
	useScreenState,
} from "./hooks/navigation/use-screen-state";
export {
	type ScreenAnimationTarget,
	useScreenAnimation,
} from "./providers/screen/animation";
export {
	type ScreenGestureTarget,
	useScreenGesture,
} from "./providers/screen/gestures/hooks/use-screen-gesture";

export type {
	AnimatedViewStyle,
	AnimationConfig,
	BoundaryTeleportControl,
	BoundsMotion,
	BoundsMotionFrame,
	BoundsMotionTransform,
	BoundsNavigationAccessor,
	BoundsNavigationRevealOptions,
	BoundsNavigationRevealStyle,
	BoundsNavigationZoomOpacityRange,
	BoundsNavigationZoomOpacityRanges,
	BoundsNavigationZoomOptions,
	BoundsNavigationZoomStyle,
	GestureHandoffValues,
	InactiveBehavior,
	OverlayProps,
	RawGestureValues,
	ScreenInterpolationProps,
	ScreenStyleInterpolator,
	ScreenTransitionAccessor,
	ScreenTransitionConfig,
	ScreenTransitionDepthTarget,
	ScreenTransitionTarget,
	ScrollGestureAxis,
	ScrollGestureAxisState,
	ScrollGestureState,
	ScrollMetadataState,
	TransitionInterpolatedStyle,
	TransitionSlotProps,
	TransitionSlotStyle,
	TransitionSpec,
} from "./types";
