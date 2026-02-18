import { FlatList, Pressable, ScrollView, View } from "react-native";
import { Boundary } from "./components/bounds/boundary";
import { createTransitionAwareComponent } from "./components/create-transition-aware-component";
import MaskedView from "./components/integrations/masked-view";
import { Presets, Specs } from "./configs";

export default {
	createTransitionAwareComponent,
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
export type { BoundaryProps } from "./components/bounds/boundary";
export { Boundary, buildBoundaryMatchKey } from "./components/bounds/boundary";
export { useScreenAnimation } from "./hooks/animation/use-screen-animation";
export { useScreenGesture } from "./hooks/gestures/use-screen-gesture";
export { useHistory } from "./hooks/navigation/use-history";
export {
	type ScreenState,
	useScreenState,
} from "./hooks/navigation/use-screen-state";
export type {
	AnimationConfig,
	BoundEntry,
	BoundsLink,
	BoundsMatchAccessor,
	BoundsMatchParams,
	BoundsMatchStyleOptions,
	OverlayInterpolationProps,
	OverlayMode,
	OverlayProps,
	ScreenInterpolationProps,
	ScreenStyleInterpolator,
	ScreenTransitionConfig,
	TransitionInterpolatedStyle,
	TransitionSpec,
} from "./types";
