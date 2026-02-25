import { FlatList, Pressable, ScrollView, View } from "react-native";
import {
	Boundary,
	createBoundaryComponent,
} from "./components/create-boundary-component";
import { buildBoundaryMatchKey } from "./components/create-boundary-component/utils/build-boundary-match-key";
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
export { useScreenAnimation } from "./hooks/animation/use-screen-animation";
export { useScreenGesture } from "./hooks/gestures/use-screen-gesture";
export { useHistory } from "./hooks/navigation/use-history";
export {
	type ScreenState,
	useScreenState,
} from "./hooks/navigation/use-screen-state";
export { buildBoundaryMatchKey };

export type {
	AnimatedViewStyle,
	AnimationConfig,
	BoundEntry,
	BoundsLink,
	BoundsNavigationAccessor,
	BoundsNavigationOptions,
	BoundsNavigationPreset,
	BoundsStyleOptions,
	LegacyTransitionInterpolatedStyle,
	NewTransitionInterpolatedStyle,
	NormalizedTransitionInterpolatedStyle,
	NormalizedTransitionSlotStyle,
	OverlayInterpolationProps,
	OverlayMode,
	OverlayProps,
	ScreenInterpolationProps,
	ScreenStyleInterpolator,
	ScreenTransitionConfig,
	TransitionInterpolatedStyle,
	TransitionSlotExplicit,
	TransitionSlotStyle,
	TransitionSpec,
} from "./types";
