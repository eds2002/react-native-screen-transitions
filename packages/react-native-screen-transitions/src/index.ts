import { FlatList, Pressable, ScrollView, View } from "react-native";
import { createTransitionAwareComponent } from "./components/create-transition-aware-component";
import { presets, specs } from "./configs";
import { createTransitionableStackNavigator } from "./navigator/create-transitionable-stack-navigator";
import { createConfig, createScreenConfig } from "./utils/create-config";
import { defaultScreenOptions } from "./utils/default-screen-options";

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
	/**
	 * @deprecated Use {@link createTransitionableStackNavigator} instead.
	 */
	createConfig,
	/**
	 * @deprecated Use {@link createTransitionableStackNavigator} instead.
	 */
	createScreenConfig,
	/**
	 * @deprecated Use {@link createTransitionableStackNavigator} instead.
	 */
	/**
	 * @deprecated Use the navigator @see {@link createTransitionableStackNavigator}  by default, the navigator will use the default screen options, unless overriden by `skipDefaultScreenOptions`
	 */
	defaultScreenOptions,
};

export { useScreenAnimation } from "./navigator/contexts/screen-animation";

// Navigator type
export type { TransitionStackNavigatorTypeBag } from "./navigator/create-transitionable-stack-navigator";

/**
 * Configuration type for screen transitions. Use this to build custom presets.
 */
export type { TransitionConfig } from "./types";
