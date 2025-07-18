import { FlatList, Pressable, ScrollView, View } from "react-native";
import { presets, specs } from "./configs";
import { useScreenAnimation } from "./hooks/use-screen-animation";
import { createConfig } from "./utils/create-config";
import { createTransitionAwareComponent } from "./utils/create-transition-aware-component";
import { createTransitionAwareScrollable } from "./utils/create-transition-aware-scrollable";
import { defaultScreenOptions } from "./utils/default-screen-options";

export default {
	View: createTransitionAwareComponent(View),
	Pressable: createTransitionAwareComponent(Pressable),
	ScrollView: createTransitionAwareScrollable(ScrollView),
	FlatList: createTransitionAwareScrollable(FlatList),
	createConfig,
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
