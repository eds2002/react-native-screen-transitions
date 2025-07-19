import { FlatList, Pressable, ScrollView, View } from "react-native";
import { createTransitionAwareComponent } from "./components/create-transition-aware-component";
import { createTransitionAwareScrollable } from "./components/create-transition-aware-scrollable";
import { presets, specs } from "./configs";
import { useScreenAnimation } from "./hooks/use-screen-animation";
import { createConfig, createScreenConfig } from "./utils/create-config";
import { defaultScreenOptions } from "./utils/default-screen-options";

export default {
	View: createTransitionAwareComponent(View),
	Pressable: createTransitionAwareComponent(Pressable),
	ScrollView: createTransitionAwareScrollable(ScrollView),
	FlatList: createTransitionAwareScrollable(FlatList),
	createConfig,
	createScreenConfig,
	defaultScreenOptions,
	presets,
	specs,
	/**
	 * Create a transition aware component
	 */
	createTransitionAwareComponent,
	/**
	 * Create a transition aware scrollable component
	 */
	createTransitionAwareScrollable,
};

export { useScreenAnimation };
