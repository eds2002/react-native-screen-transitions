import "react-native-reanimated";
import type {
	ParamListBase,
	StackNavigationState,
} from "@react-navigation/native";
import { withLayoutContext } from "expo-router";
import Transition from "react-native-screen-transitions";
import {
	type BlankStackNavigationEventMap,
	type BlankStackNavigationOptions,
	createBlankStackNavigator,
} from "react-native-screen-transitions/blank-stack";
import { horizontalSlide, verticalSlide } from "./interpolators";

const { Navigator } = createBlankStackNavigator();

export const BlankStack = withLayoutContext<
	BlankStackNavigationOptions,
	typeof Navigator,
	StackNavigationState<ParamListBase>,
	BlankStackNavigationEventMap
>(Navigator);

export const defaultScreenOptions: BlankStackNavigationOptions = {
	gestureEnabled: true,
	gestureDirection: "horizontal",
	screenStyleInterpolator: horizontalSlide,
	transitionSpec: {
		open: Transition.Specs.DefaultSpec,
		close: Transition.Specs.DefaultSpec,
	},
};

export const verticalScreenOptions: BlankStackNavigationOptions = {
	gestureEnabled: true,
	gestureDirection: "vertical",
	screenStyleInterpolator: verticalSlide,
	transitionSpec: {
		open: Transition.Specs.DefaultSpec,
		close: Transition.Specs.DefaultSpec,
	},
};
