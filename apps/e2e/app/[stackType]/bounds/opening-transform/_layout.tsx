import { interpolate } from "react-native-reanimated";
import type { ScreenTransitionConfig } from "react-native-screen-transitions";
import Transition from "react-native-screen-transitions";
import { useResolvedStackType } from "@/components/stack-examples/stack-routing";
import { BlankStack } from "@/layouts/blank-stack";
import { Stack } from "@/layouts/stack";
import { OPENING_TRANSFORM_BOUNDARY_ID } from "./constants";

const openingTransformInterpolator: ScreenTransitionConfig["screenStyleInterpolator"] =
	({ progress, bounds, layouts, focused }) => {
		"worklet";

		const y = interpolate(
			progress,
			[0, 1],
			[layouts.screen.height, 0],
			"clamp",
		);
		return {
			content: {
				style: {
					transform: [
						{
							translateY: y,
						},
					],
				},
			},
			[OPENING_TRANSFORM_BOUNDARY_ID]: bounds({
				id: OPENING_TRANSFORM_BOUNDARY_ID,
				gestures: { y: focused ? -y : undefined },
			}) as any,
		};
	};

export default function OpeningTransformBoundsLayout() {
	const stackType = useResolvedStackType();
	const StackNavigator = stackType === "native-stack" ? Stack : BlankStack;
	const navigatorScreenOptions =
		stackType === "native-stack" ? { enableTransitions: true } : undefined;

	return (
		<StackNavigator screenOptions={navigatorScreenOptions}>
			<StackNavigator.Screen name="index" />
			<StackNavigator.Screen
				name="destination"
				options={{
					gestureEnabled: true,
					gestureDirection: ["vertical", "vertical-inverted"],
					screenStyleInterpolator: openingTransformInterpolator,
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.DefaultSpec,
					},
				}}
			/>
		</StackNavigator>
	);
}
