import { FlatList, Pressable, ScrollView, View } from "react-native";
import { createTransitionAwareComponent } from "./components/create-transition-aware-component";
import { presets, specs } from "./configs";

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
};

export { createNativeStackNavigator } from "./navigator/components/createNativeStackNavigator";

export { useScreenAnimation } from "./navigator/hooks/use-screen-animation";

export type {
	NativeStackHeaderLeftProps,
	NativeStackHeaderProps,
	NativeStackHeaderRightProps,
	NativeStackNavigationEventMap,
	NativeStackNavigationOptions,
	NativeStackNavigationProp,
	NativeStackNavigatorProps,
	NativeStackOptionsArgs,
	NativeStackScreenProps,
} from "./types/navigator";
