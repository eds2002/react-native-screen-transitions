import Transition from "react-native-screen-transitions";
import type { BlankStackNavigationOptions } from "react-native-screen-transitions/blank-stack";
import { BlankStack } from "@/layouts/blank-stack";

const BOUNDARY_ID = "video-nested";

const matchedScreenDebugInterpolator: BlankStackNavigationOptions["screenStyleInterpolator"] =
	({ bounds }) => {
		"worklet";
		const boundaryStyle = bounds(BOUNDARY_ID).styles() as Record<string, any>;

		return {
			[BOUNDARY_ID]: boundaryStyle,
		};
	};

const singleInstanceOptions = {
	gestureEnabled: true,
	gestureDirection: ["vertical", "vertical-inverted"],
	inactiveBehavior: "keep",
	screenStyleInterpolator: matchedScreenDebugInterpolator,
	transitionSpec: {
		open: Transition.Specs.DefaultSpec,
		close: Transition.Specs.DefaultSpec,
	},
} satisfies BlankStackNavigationOptions;

export default function MatchedScreenDebugLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" options={singleInstanceOptions} />
			<BlankStack.Screen name="player" options={singleInstanceOptions} />
			<BlankStack.Screen name="final" options={singleInstanceOptions} />
		</BlankStack>
	);
}
