// @ts-nocheck

import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { useResolvedStackType } from "@/components/stack-examples/stack-routing";
import { BlankStack } from "@/layouts/blank-stack";
import { Stack } from "@/layouts/stack";

export default function StackProgressLayout() {
	const stackType = useResolvedStackType();
	const StackNavigator = stackType === "native-stack" ? Stack : BlankStack;
	const navigatorScreenOptions =
		stackType === "native-stack"
			? { enableTransitions: true, inactiveBehavior: "unmount" }
			: undefined;
	return (
		<StackNavigator screenOptions={navigatorScreenOptions}>
			<StackNavigator.Screen name="index" />
			<StackNavigator.Screen
				name="pushed"
				options={{
					gestureEnabled: true,
					gestureDirection: "vertical",
					inactiveBehavior: "unmount",
					screenStyleInterpolator: ({ stackProgress, current }) => {
						"worklet";

						if (current.route.name !== "index") return {};
						const translateY = interpolate(
							stackProgress,
							[1, 2, 3, 4],
							[0, 100, 180, 240],
						);
						const scale = interpolate(
							stackProgress,
							[1, 2, 3, 4],
							[1, 0.92, 0.85, 0.8],
						);
						const borderRadius = interpolate(
							stackProgress,
							[1, 2, 3, 4],
							[0, 16, 24, 32],
						);

						return {
							content: {
								transform: [{ translateY }, { scale }],
								borderRadius,
							},
						};
					},
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.DefaultSpec,
					},
				}}
			/>
		</StackNavigator>
	);
}
