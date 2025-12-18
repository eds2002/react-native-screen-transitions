import { FlatList, Pressable, ScrollView, View } from "react-native";
import { createTransitionAwareComponent } from "./components/create-transition-aware-component";
import MaskedView from "./components/integrations/masked-view";
import { Presets, Specs } from "./configs";

export default {
	createTransitionAwareComponent,
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

export { useScreenAnimation } from "./hooks/animation/use-screen-animation";
export { useScreenGesture } from "./hooks/gestures/use-screen-gesture";

export type {
	AnimationConfig,
	BoundEntry,
	BoundsLink,
	ContainerOverlayProps,
	OverlayInterpolationProps,
	OverlayMode,
	OverlayProps,
	ScreenInterpolationProps,
	ScreenStyleInterpolator,
	ScreenTransitionConfig,
} from "./types";
