import { FlatList, Pressable, ScrollView, View } from "react-native";
import { createTransitionAwareComponent } from "./components/create-transition-aware-component";
import { presets, specs } from "./configs";
import { createTransitionableStackNavigator } from "./navigator/create-transitionable-stack-navigator";

export default {
	View: createTransitionAwareComponent(View),
	Pressable: createTransitionAwareComponent(Pressable),
	ScrollView: createTransitionAwareComponent(ScrollView, {
		isScrollable: true,
	}),
	FlatList: createTransitionAwareComponent(FlatList, {
		isScrollable: true,
	}),

	presets,
	specs,
	/**
	 * Create a transition aware component
	 */
	createTransitionAwareComponent,

	/**
	 * Create a transitionable native stack navigator.
	 *
	 */
	createTransitionableStackNavigator,
};

export { useScreenAnimation } from "./navigator/contexts/screen-animation";

// Navigator type
export type { TransitionStackNavigatorTypeBag } from "./navigator/create-transitionable-stack-navigator";

/**
 * Configuration type for screen transitions. Use this to build custom presets.
 */
export type { TransitionConfig } from "./types";
