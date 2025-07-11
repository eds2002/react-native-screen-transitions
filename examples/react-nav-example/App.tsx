import { createStaticNavigation } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Transition from "react-native-screen-transitions";
import Custom from "./screens/Custom";
import { GroupANavigator } from "./screens/group-a/GroupANavigator";
import { Home } from "./screens/Home";
import { ScreenA } from "./screens/ScreenA";
import { ScreenB } from "./screens/ScreenB";
import { ScreenC } from "./screens/ScreenC";
import { ScreenD } from "./screens/ScreenD";
import { ScreenE } from "./screens/ScreenE";

const RootStack = createNativeStackNavigator({
	screens: {
		Home: {
			screen: Home,
			options: Transition.defaultScreenOptions(),
			listeners: Transition.createConfig,
		},
		ScreenA: {
			screen: ScreenA,
			options: Transition.defaultScreenOptions(),
			listeners: (l) =>
				Transition.createConfig({
					...l,
					...Transition.presets.SlideFromTop(),
				}),
		},
		ScreenB: {
			screen: ScreenB,
			options: Transition.defaultScreenOptions(),
			listeners: (l) =>
				Transition.createConfig({
					...l,
					...Transition.presets.ZoomIn(),
				}),
		},
		ScreenC: {
			screen: ScreenC,
			options: Transition.defaultScreenOptions(),
			listeners: (l) =>
				Transition.createConfig({
					...l,
					...Transition.presets.SlideFromBottom(),
				}),
		},
		ScreenD: {
			screen: ScreenD,
			options: Transition.defaultScreenOptions(),
			listeners: (l) =>
				Transition.createConfig({
					...l,
					...Transition.presets.DraggableCard(),
				}),
		},
		ScreenE: {
			screen: ScreenE,
			options: Transition.defaultScreenOptions(),
			listeners: (l) =>
				Transition.createConfig({
					...l,
					...Transition.presets.ElasticCard(),
				}),
		},
		GroupA: {
			screen: GroupANavigator,
			options: Transition.defaultScreenOptions(),
			listeners: (l) =>
				Transition.createConfig({
					...l,
					...Transition.presets.DraggableCard(),
				}),
		},
		Custom: {
			screen: Custom,
			options: Transition.defaultScreenOptions(),
			listeners: Transition.createConfig,
		},
	},
});

const Navigation = createStaticNavigation(RootStack);

export default function App() {
	return (
		<GestureHandlerRootView>
			<Navigation />
		</GestureHandlerRootView>
	);
}
