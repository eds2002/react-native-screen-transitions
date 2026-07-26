import Transition from "react-native-screen-transitions";
import type { BlankStackNavigationOptions } from "react-native-screen-transitions/blank-stack";
import { BlankStack } from "@/layouts/blank-stack";

const BOUNDARY_ID = "video-nested";

const handoffMultiflowInterpolator: BlankStackNavigationOptions["screenStyleInterpolator"] =
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
	screenStyleInterpolator: handoffMultiflowInterpolator,
	transitionSpec: {
		open: Transition.Specs.DefaultSpec,
		close: Transition.Specs.DefaultSpec,
	},
} satisfies BlankStackNavigationOptions;

export default function HandoffMultiflowLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" options={singleInstanceOptions} />
			<BlankStack.Screen name="a" options={singleInstanceOptions} />
			<BlankStack.Screen name="b" options={singleInstanceOptions} />
			<BlankStack.Screen name="c" options={singleInstanceOptions} />
			<BlankStack.Screen name="d" options={singleInstanceOptions} />
			<BlankStack.Screen name="e" options={singleInstanceOptions} />
		</BlankStack>
	);
}
