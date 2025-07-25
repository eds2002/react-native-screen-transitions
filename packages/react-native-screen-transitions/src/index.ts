import { FlatList, Pressable, ScrollView, View } from "react-native";

import { createTransitionAwareComponent } from "./components/create-transition-aware-component";
import { createTransitionAwareScrollable } from "./components/create-transition-aware-scrollable";
import { presets, specs } from "./configs";
import { useScreenAnimation } from "./hooks/use-screen-animation";
import { createTransitionableStackNavigator } from "./navigator/create-transitionable-stack-navigator";
import { createConfig, createScreenConfig } from "./utils/create-config";
import { defaultScreenOptions } from "./utils/default-screen-options";

export default {
	View: createTransitionAwareComponent(View),
	Pressable: createTransitionAwareComponent(Pressable),
	ScrollView: createTransitionAwareScrollable(ScrollView),
	FlatList: createTransitionAwareScrollable(FlatList),

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
	 * Create a transition aware scrollable component
	 * @deprecated Use {@link createTransitionAwareComponent} instead.
	 */
	createTransitionAwareScrollable,
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
export { Bounds } from "./components/bounds";
export { useScreenAnimation };

// Navigator type
export type { TransitionStackNavigatorTypeBag } from "./navigator/create-transitionable-stack-navigator";

/**
 * Configuration type for screen transitions. Use this to build custom presets.
 */
export type { TransitionConfig } from "./types";
