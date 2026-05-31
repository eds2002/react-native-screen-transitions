import { interpolate } from "react-native-reanimated";
import type { ScreenTransitionConfig } from "react-native-screen-transitions";
import Transition from "react-native-screen-transitions";
import { useResolvedStackType } from "@/components/stack-examples/stack-routing";
import { BlankStack } from "@/layouts/blank-stack";
import { Stack } from "@/layouts/stack";
import {
	TRANSITION_SCOPE_BOUNDARY_ID,
	TRANSITION_SCOPE_META_ID,
	TRANSITION_SCOPE_TITLE_ID,
} from "../constants";

const inheritedBoundsInterpolator: ScreenTransitionConfig["screenStyleInterpolator"] =
	() => {
		"worklet";
		return {};
	};

const nestedPushInterpolator: ScreenTransitionConfig["screenStyleInterpolator"] =
	({ bounds, progress }) => {
		"worklet";

		const imageStyle = bounds({
			id: TRANSITION_SCOPE_BOUNDARY_ID,
			method: "transform",
		}) as Record<string, any>;
		const titleStyle = bounds({
			id: TRANSITION_SCOPE_TITLE_ID,
			method: "transform",
		}) as Record<string, any>;
		const metaStyle = bounds({
			id: TRANSITION_SCOPE_META_ID,
			method: "transform",
		}) as Record<string, any>;

		return {
			content: {
				style: {
					opacity: interpolate(progress, [0, 0.2, 1], [0, 1, 1], "clamp"),
				},
			},
			[TRANSITION_SCOPE_BOUNDARY_ID]: imageStyle,
			[TRANSITION_SCOPE_TITLE_ID]: titleStyle,
			[TRANSITION_SCOPE_META_ID]: metaStyle,
		};
	};

export default function TransitionScopeNestedLayout() {
	const stackType = useResolvedStackType();
	const StackNavigator = stackType === "native-stack" ? Stack : BlankStack;
	const navigatorScreenOptions =
		stackType === "native-stack" ? { enableTransitions: true } : undefined;

	return (
		<StackNavigator screenOptions={navigatorScreenOptions}>
			<StackNavigator.Screen
				name="index"
				options={{
					screenStyleInterpolator: inheritedBoundsInterpolator,
					experimental_animateOnInitialMount: true,
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.DefaultSpec,
					},
				}}
			/>
			<StackNavigator.Screen
				name="deep"
				options={{
					gestureEnabled: true,
					gestureDirection: ["vertical", "vertical-inverted"],
					screenStyleInterpolator: nestedPushInterpolator,
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.DefaultSpec,
					},
				}}
			/>
		</StackNavigator>
	);
}
