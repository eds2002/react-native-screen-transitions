import { FlatList, Pressable, ScrollView, View } from "react-native";
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

export { snapTo } from "./animation/snap-to";
export {
	NAVIGATION_MASK_CONTAINER_STYLE_ID,
	NAVIGATION_MASK_ELEMENT_STYLE_ID,
} from "./constants";
export {
	type ScreenGestureTarget,
	useScreenGesture,
} from "./hooks/gestures/use-screen-gesture";
export { useHistory } from "./hooks/navigation/use-history";
export {
	type ScreenState,
	useScreenState,
} from "./hooks/navigation/use-screen-state";
export {
	type ScreenAnimationTarget,
	useScreenAnimation,
} from "./providers/screen/animation";

export type {
	AnimatedViewStyle,
	AnimationConfig,
	BoundsNavigationAccessor,
	BoundsNavigationZoomOptions,
	DeferredScreenStyleSignal,
	OverlayProps,
	ScreenInterpolationProps,
	ScreenStyleInterpolator,
	ScreenTransitionConfig,
	TransitionInterpolatedStyle,
	TransitionSlotStyle,
	TransitionSpec,
} from "./types";
