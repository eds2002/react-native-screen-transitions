import { createNativeStackNavigator } from "expo-router/build/fork/native-stack/createNativeStackNavigator";
import { withLayoutContext } from "expo-router";
import { withScreenTransitions } from "react-native-screen-transitions";

const NativeStack = createNativeStackNavigator();
const TransitionNativeStack = withScreenTransitions(NativeStack);

export const NativeStackAdapter = withLayoutContext(
	TransitionNativeStack.Navigator,
);
