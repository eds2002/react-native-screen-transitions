import { StatusBar } from "expo-status-bar";
import Transition, {
	type ScreenTransitionConfig,
} from "react-native-screen-transitions";
import { MEDIA_BOUNDARY_ID } from "../media";
import { BlankStack } from "../navigation/blank-stack";

const detailOptions = Transition.Presets.SlideFromBottom();
const sheetOptions = Transition.Presets.SlideFromBottom({
	initialSnapIndex: 0,
	snapPoints: [0.55, 1],
});
const mediaZoomOptions: ScreenTransitionConfig = {
	gestureEnabled: true,
	gestureDirection: ["bidirectional", "pinch-in"],
	navigationMaskEnabled: true,
	transitionSpec: Transition.Specs.Zoom,
	screenStyleInterpolator: ({ bounds }) => {
		"worklet";

		return bounds(MEDIA_BOUNDARY_ID).navigation.zoom({
			target: "bound",
		});
	},
};

export default function RootLayout() {
	return (
		<>
			<StatusBar style="light" />
			<BlankStack>
				<BlankStack.Screen name="index" />
				<BlankStack.Screen name="detail" options={detailOptions} />
				<BlankStack.Screen name="sheet" options={sheetOptions} />
				<BlankStack.Screen name="media" options={mediaZoomOptions} />
			</BlankStack>
		</>
	);
}
