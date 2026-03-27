import "react-native-reanimated";
import type {
	ParamListBase,
	StackNavigationState,
} from "@react-navigation/native";
import { withLayoutContext } from "expo-router";
import type { ComponentProps } from "react";
import { Platform } from "react-native";
import {
	type BlankStackNavigationEventMap,
	type BlankStackNavigationOptions,
	createBlankStackNavigator,
} from "react-native-screen-transitions/blank-stack";

const { Navigator } = createBlankStackNavigator();

function BlankStackNavigator(props: ComponentProps<typeof Navigator>) {
	/**
	 * Note, on android you may use native screens, however, pass through
	 * events seem to be a little buggy. During fast navigation, or even deeply
	 * nested navigational events on android, you do get a Fragment Manager bug.
	 * Hoping this could possibly be solved in the next major release of
	 * react-native-screens. Or maybe this is an issue on our end LOL
	 */
	const enableNativeScreens =
		props.enableNativeScreens ?? Platform.OS === "ios";

	return <Navigator {...props} enableNativeScreens={enableNativeScreens} />;
}

export const BlankStack = withLayoutContext<
	BlankStackNavigationOptions,
	typeof BlankStackNavigator,
	StackNavigationState<ParamListBase>,
	BlankStackNavigationEventMap
>(BlankStackNavigator);
