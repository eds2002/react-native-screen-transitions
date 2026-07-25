import { interpolate } from "react-native-reanimated";
import type { ScreenTransitionConfig } from "react-native-screen-transitions";
import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";
import { SHEET_ZOOM_BOUNDARY_ID } from "./constants";

const sheetOptions: ScreenTransitionConfig = {
	gestureEnabled: true,
	gestureDirection: "vertical",
	snapPoints: [0.5],
	initialSnapIndex: 0,

	screenStyleInterpolator: ({
		layouts: {
			screen: { height },
		},
		current,
		focused,
	}) => {
		"worklet";

		const translateY = interpolate(
			current.progress,
			[0, 1],
			[height, 0],
			"clamp",
		);

		return {
			content: {
				style: {
					transform: [{ translateY }],
				},
			},
			backdrop: focused
				? {
						style: {
							backgroundColor: "black",
							opacity: interpolate(
								current.progress,
								[0, 0.5],
								[0, 0.4],
								"clamp",
							),
						},
					}
				: undefined,
		};
	},
	transitionSpec: {
		open: Transition.Specs.DefaultSpec,
		close: Transition.Specs.DefaultSpec,
	},
};

const zoomOptions: ScreenTransitionConfig = {
	gestureEnabled: true,
	gestureDirection: ["bidirectional", "pinch-in"],
	navigationMaskEnabled: true,
	screenStyleInterpolator: ({ bounds }) => {
		"worklet";
		return bounds(SHEET_ZOOM_BOUNDARY_ID).navigation.zoom();
	},
	transitionSpec: Transition.Specs.Zoom,
};

export default function ExampleLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" options={{ inactiveBehavior: "pause" }} />
			<BlankStack.Screen name="sheet" options={sheetOptions} />
			<BlankStack.Screen name="zoom" options={zoomOptions} />
		</BlankStack>
	);
}
