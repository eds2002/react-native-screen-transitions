import { interpolate } from "react-native-reanimated";
import type { ScreenTransitionConfig } from "react-native-screen-transitions";
import Transition from "react-native-screen-transitions";
import { useResolvedStackType } from "@/components/stack-examples/stack-routing";
import { BlankStack } from "@/layouts/blank-stack";
import { Stack } from "@/layouts/stack";
import { MATCHED_SCREEN_VIDEO_ID } from "./constants";

const matchedScreenInterpolator: ScreenTransitionConfig["screenStyleInterpolator"] =
	({ bounds, layouts, focused, active, progress }) => {
		"worklet";

		const videoStyle = bounds(MATCHED_SCREEN_VIDEO_ID).styles();

		if (focused) {
			console.log(progress);
			return {
				backdrop: {
					backgroundColor: "#000000",
					opacity: progress,
				},
			};
		}

		return {
			[MATCHED_SCREEN_VIDEO_ID]: {
				...videoStyle,
				borderRadius: interpolate(active.progress, [0, 1], [24, 0], "clamp"),
			},
		};
	};

export default function MatchedScreenLayout() {
	const stackType = useResolvedStackType();
	const StackNavigator = stackType === "native-stack" ? Stack : BlankStack;
	const navigatorScreenOptions =
		stackType === "native-stack" ? { enableTransitions: true } : undefined;

	return (
		<StackNavigator screenOptions={navigatorScreenOptions}>
			<StackNavigator.Screen name="index" />
			<StackNavigator.Screen
				name="player"
				options={{
					gestureEnabled: true,
					gestureDirection: ["vertical", "vertical-inverted"],
					inactiveBehavior: "keep",
					screenStyleInterpolator: matchedScreenInterpolator,
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.DefaultSpec,
					},
				}}
			/>
		</StackNavigator>
	);
}
