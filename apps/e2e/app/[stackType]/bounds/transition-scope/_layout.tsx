import { interpolate } from "react-native-reanimated";
import type { ScreenTransitionConfig } from "react-native-screen-transitions";
import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";
import {
	TRANSITION_SCOPE_BOUNDARY_ID,
	TRANSITION_SCOPE_META_ID,
	TRANSITION_SCOPE_TITLE_ID,
} from "./constants";

const parentPushInterpolator: ScreenTransitionConfig["screenStyleInterpolator"] =
	({ bounds, progress }) => {
		"worklet";

		const imageStyle = bounds({
			id: TRANSITION_SCOPE_BOUNDARY_ID,
			method: "transform",
			anchor: "center",
		}) as Record<string, any>;
		const titleStyle = bounds({
			id: TRANSITION_SCOPE_TITLE_ID,
			method: "transform",
			anchor: "center",
		}) as Record<string, any>;
		const metaStyle = bounds({
			id: TRANSITION_SCOPE_META_ID,
			method: "transform",
			anchor: "center",
		}) as Record<string, any>;

		return {
			content: {
				opacity: interpolate(progress, [0, 1, 2], [0, 1, 0]),
			},
			[TRANSITION_SCOPE_BOUNDARY_ID]: imageStyle,
			[TRANSITION_SCOPE_TITLE_ID]: titleStyle,
			[TRANSITION_SCOPE_META_ID]: metaStyle,
		};
	};

export default function TransitionScopeLayout() {
	const StackNavigator = BlankStack;

	return (
		<StackNavigator>
			<StackNavigator.Screen name="index" />
			<StackNavigator.Screen
				name="nested"
				options={{
					gestureEnabled: true,
					gestureDirection: ["vertical", "vertical-inverted"],
					screenStyleInterpolator: parentPushInterpolator,
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.DefaultSpec,
					},
				}}
			/>
		</StackNavigator>
	);
}
