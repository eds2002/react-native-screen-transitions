import { FlatList, Pressable, ScrollView, View } from "react-native";
import { withScreenTransitions } from "./adapters/with-screen-transitions";
import {
	Boundary,
	createBoundaryComponent,
} from "./components/create-boundary-component";
import { createTransitionAwareComponent } from "./components/create-transition-aware-component";
import MaskedView from "./components/integrations/masked-view";
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

export type {
	NativeStackAdapterOptions,
	NativeStackNativeGestureOptions,
	ScreenTransitionDescriptorOptions,
} from "./adapters/with-screen-transitions";
export { withScreenTransitions } from "./adapters/with-screen-transitions";
export { snapTo } from "./animation/snap-to";
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
	BoundsNavigationAccessor,
	BoundsNavigationRevealStyle,
	BoundsNavigationZoomOpacityRange,
	BoundsNavigationZoomOpacityRanges,
	BoundsNavigationZoomOptions,
	BoundsNavigationZoomStyle,
	InactiveBehavior,
	OverlayProps,
	ScreenInterpolationProps,
	ScreenStyleInterpolator,
	ScreenTransitionConfig,
	TransitionInterpolatedStyle,
	TransitionSlotStyle,
	TransitionSpec,
} from "./types";
