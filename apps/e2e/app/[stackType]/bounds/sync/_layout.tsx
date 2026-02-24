// @ts-nocheck
import { interpolate } from "react-native-reanimated";
import type { ScreenTransitionConfig } from "react-native-screen-transitions";
import Transition from "react-native-screen-transitions";
import { useResolvedStackType } from "@/components/stack-examples/stack-routing";
import { BlankStack } from "@/layouts/blank-stack";
import { Stack } from "@/layouts/stack";
import { ALL_CASES, activeCaseId, BOUNDARY_TAG } from "./constants";

const resolveActiveCase = () => {
	"worklet";
	const id = activeCaseId.value;
	for (let i = 0; i < ALL_CASES.length; i++) {
		if (ALL_CASES[i].id === id) {
			return ALL_CASES[i];
		}
	}
	return ALL_CASES[0];
};

const syncInterpolator: ScreenTransitionConfig["screenStyleInterpolator"] = ({
	bounds,
	progress,
	focused,
}) => {
	"worklet";

	const testCase = resolveActiveCase();
	const sourceBoundary = testCase.source.boundary;
	const destinationBoundary = testCase.destination.boundary;
	const activeBoundary = focused ? destinationBoundary : sourceBoundary;
	const activeStyleOptions = {
		id: BOUNDARY_TAG,
		method: activeBoundary?.method,
		anchor: activeBoundary?.anchor,
		scaleMode: activeBoundary?.scaleMode,
		target: activeBoundary?.target,
	};

	if (destinationBoundary?.method === "content") {
		if (focused) {
			const contentStyles = bounds(activeStyleOptions);

			return {
				content: {
					style: contentStyles,
				},
				backdrop: {
					style: {
						backgroundColor: "black",
						opacity: interpolate(progress, [0, 1], [0, 0.5]),
					},
				},
			};
		}

		const elementStyle = bounds(activeStyleOptions) as Record<string, any>;

		return {
			[BOUNDARY_TAG]: {
				...elementStyle,
				opacity: focused
					? interpolate(progress, [0, 1], [0, 1], "clamp")
					: interpolate(progress, [1, 2], [1, 0], "clamp"),
			},
		};
	}

	const elementStyle = bounds(activeStyleOptions) as Record<string, any>;

	return {
		[BOUNDARY_TAG]: {
			...elementStyle,
			opacity: focused
				? interpolate(progress, [0, 1], [0, 1], "clamp")
				: interpolate(progress, [1, 2], [1, 0], "clamp"),
		},
	};
};

export default function BoundsSyncLayout() {
	const stackType = useResolvedStackType();
	const StackNavigator = stackType === "native-stack" ? Stack : BlankStack;
	const navigatorScreenOptions =
		stackType === "native-stack" ? { enableTransitions: true } : undefined;

	return (
		<StackNavigator screenOptions={navigatorScreenOptions}>
			<StackNavigator.Screen name="index" />
			<StackNavigator.Screen
				name="source"
				options={{
					...Transition.Presets.SlideFromBottom(),
				}}
			/>
			<StackNavigator.Screen
				name="destination"
				options={{
					gestureEnabled: true,
					gestureDirection: ["vertical-inverted", "vertical"],
					screenStyleInterpolator: syncInterpolator,
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.DefaultSpec,
					},
				}}
			/>
		</StackNavigator>
	);
}
