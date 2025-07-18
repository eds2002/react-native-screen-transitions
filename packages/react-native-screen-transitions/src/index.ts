import { FlatList, Pressable, ScrollView, View } from "react-native";
import { presets, specs } from "./configs";
import { useScreenAnimation } from "./hooks/use-screen-animation";
import { createConfig } from "./utils/create-config";
import { createTransitionComponent } from "./utils/create-transition-component";
import { createTransitionScrollable } from "./utils/create-transition-scrollable";
import { defaultScreenOptions } from "./utils/default-screen-options";

export default {
	createTransitionComponent,
	View: createTransitionComponent(View),
	Pressable: createTransitionComponent(Pressable),
	ScrollView: createTransitionScrollable(ScrollView),
	FlatList: createTransitionScrollable(FlatList),
	createConfig,
	defaultScreenOptions,
	presets,
	specs,
};

export { useScreenAnimation };
