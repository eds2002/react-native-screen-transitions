import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import Transition, {
	type ScreenTransitionConfig,
} from "react-native-screen-transitions";
import { createBlankStackNavigator } from "react-native-screen-transitions/react-navigation";
import { MEDIA_BOUNDARY_ID } from "./src/media";
import type { RootStackParamList } from "./src/navigation/types";
import { DetailScreen } from "./src/screens/detail-screen";
import { HomeScreen } from "./src/screens/home-screen";
import { MediaScreen } from "./src/screens/media-screen";
import { SheetScreen } from "./src/screens/sheet-screen";

const Stack = createBlankStackNavigator<RootStackParamList>();
const detailOptions = Transition.Presets.SlideFromBottom();
const sheetOptions = Transition.Presets.SlideFromBottom({
	initialSnapIndex: 0,
	snapPoints: [0.55, 1],
});
const mediaZoomOptions: ScreenTransitionConfig = {
	gestureEnabled: true,
	gestureDirection: ["bidirectional", "pinch-in"],
	transitionSpec: Transition.Specs.Zoom,
	screenStyleInterpolator: ({ bounds }) => {
		"worklet";

		return bounds(MEDIA_BOUNDARY_ID).navigation.zoom({
			target: "bound",
		});
	},
};

export default function App() {
	return (
		<>
			<StatusBar style="light" />
			<NavigationContainer>
				<Stack.Navigator>
					<Stack.Screen name="Home" component={HomeScreen} />
					<Stack.Screen
						name="Detail"
						component={DetailScreen}
						options={detailOptions}
					/>
					<Stack.Screen
						name="Sheet"
						component={SheetScreen}
						options={sheetOptions}
					/>
					<Stack.Screen
						name="Media"
						component={MediaScreen}
						options={mediaZoomOptions}
					/>
				</Stack.Navigator>
			</NavigationContainer>
		</>
	);
}
