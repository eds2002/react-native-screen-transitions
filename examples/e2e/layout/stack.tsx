import { withLayoutContext } from "expo-router";
import Transition, {
	type TransitionStackNavigatorTypeBag,
} from "react-native-screen-transitions";

const TransitionableNativeStack =
	Transition.createTransitionableStackNavigator();

export const Stack = withLayoutContext<
	TransitionStackNavigatorTypeBag["ScreenOptions"],
	typeof TransitionableNativeStack.Navigator,
	TransitionStackNavigatorTypeBag["State"],
	TransitionStackNavigatorTypeBag["EventMap"]
>(TransitionableNativeStack.Navigator);
