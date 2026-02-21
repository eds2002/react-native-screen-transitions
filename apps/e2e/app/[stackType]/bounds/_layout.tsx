// @ts-nocheck
import { interpolate } from "react-native-reanimated";
import type { ScreenTransitionConfig } from "react-native-screen-transitions";
import Transition, {
	buildBoundaryMatchKey,
} from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";
import { Stack } from "@/layouts/stack";
import { useResolvedStackType } from "@/components/stack-examples/stack-routing";
import { activeBoundaryId, BOUNDARY_GROUP } from "./constants";

const sharedBoundaryInterpolator: ScreenTransitionConfig["screenStyleInterpolator"] =
	({ bounds, progress }) => {
		"worklet";

		const activeId = activeBoundaryId.value;

		const activeTag = buildBoundaryMatchKey({
			group: BOUNDARY_GROUP,
			id: activeId,
		});

		const scale = interpolate(progress, [0, 1, 2], [1, 1, 0.95], "clamp");

		return {
			[activeTag]: {
				...bounds({
					group: BOUNDARY_GROUP,
					id: activeId,
				}),
				opacity: interpolate(progress, [0, 0.7, 1, 1.3, 1.7], [0, 1, 1, 1, 0]),
			},
			contentStyle: {
				transform: [{ scale }],
			},
		};
	};

export default function BoundsLayout() {
	const stackType = useResolvedStackType();
	const StackNavigator = stackType === "native-stack" ? Stack : BlankStack;
	const navigatorScreenOptions =
		stackType === "native-stack" ? { enableTransitions: true } : undefined;
	return (
		<StackNavigator screenOptions={navigatorScreenOptions}>
			<StackNavigator.Screen name="index" />
			<StackNavigator.Screen
				name="[id]"
				options={{
					gestureEnabled: true,
					gestureDirection: ["vertical-inverted", "vertical"],
					screenStyleInterpolator: sharedBoundaryInterpolator,
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.DefaultSpec,
					},
				}}
			/>
		</StackNavigator>
	);
}
