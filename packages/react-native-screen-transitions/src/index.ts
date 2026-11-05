import { FlatList, Pressable, ScrollView, View } from "react-native";
import { withScreenTransitions } from "./adapters/with-screen-transitions";
import { Boundary, createBoundaryComponent } from "./components/boundary";
import { createTransitionAwareComponent } from "./components/create-transition-aware-component";
import { Presets, Specs } from "./configs";
import { MotionView } from "./motion/motion";
import { Presence } from "./motion/presence";

export default {
	createTransitionAwareComponent,
	createBoundaryComponent,
	withScreenTransitions,
	Boundary,
	Motion: MotionView,
	Presence,
	View: createTransitionAwareComponent(View),
	Pressable: createTransitionAwareComponent(Pressable),
	ScrollView: createTransitionAwareComponent(ScrollView, {
		isScrollable: true,
	}),
	FlatList: createTransitionAwareComponent(FlatList, {
		isScrollable: true,
	}),
	Presets,
	Specs,
};

export type { NativeStackAdapterOptions } from "./adapters/with-screen-transitions";
export { withScreenTransitions } from "./adapters/with-screen-transitions";
export {
	NAVIGATION_MASK_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
	TRANSFORM_RESET,
} from "./constants";
export { snapTo } from "./controls/snap-to";
export {
	blockTransition,
	unblockTransition,
} from "./controls/transition-blocking";
export { useHistory } from "./hooks/navigation/use-history";
export {
	type ScreenState,
	useScreenState,
} from "./hooks/navigation/use-screen-state";
export type { MotionViewProps } from "./motion/motion";
export type { PresenceProps } from "./motion/presence";
export type { Motion, MotionOptions, MotionStatus } from "./motion/types";
export { useMotion } from "./motion/use-motion";
export {
	type ScreenAnimationTarget,
	useScreenAnimation,
} from "./providers/motion/animation";
export {
	type ScreenGestureTarget,
	useScreenGesture,
} from "./providers/motion/gestures/ownership/hooks/use-screen-gesture";
export type {
	AnimatedViewStyle,
	AnimationConfig,
	BoundaryHandoffTarget,
	BoundsMotion,
	BoundsMotionFrame,
	BoundsMotionTransform,
	BoundsNavigationAccessor,
	BoundsNavigationRevealOptions,
	BoundsNavigationRevealStyle,
	BoundsNavigationZoomAxisResponse,
	BoundsNavigationZoomDragOptions,
	BoundsNavigationZoomOptions,
	BoundsNavigationZoomStyle,
	GestureHandoffValues,
	InactiveBehavior,
	OverlayComponent,
	OverlayProps,
	RawGestureValues,
	ScreenBackdropComponent,
	ScreenBackdropComponentProps,
	ScreenContentComponent,
	ScreenContentComponentProps,
	ScreenInterpolationProps,
	ScreenLayerComponentProps,
	ScreenStyleInterpolator,
	ScreenSurfaceComponent,
	ScreenSurfaceComponentProps,
	ScreenTransitionConfig,
	ScreenTransitionDepthTarget,
	ScreenTransitionTarget,
	ScrollGestureAxis,
	ScrollGestureAxisState,
	ScrollGestureState,
	ScrollMetadataState,
	SheetSnapBehavior,
	TransitionClip,
	TransitionInterpolatedStyle,
	TransitionSlotProps,
	TransitionSlotStyle,
	TransitionSpec,
} from "./types";
export type { SnapPoint } from "./types/screen.types";
