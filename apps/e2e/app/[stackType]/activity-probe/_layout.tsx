import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import type { BlankStackNavigationOptions } from "react-native-screen-transitions/blank-stack";
import { useResolvedStackType } from "@/components/stack-examples/stack-routing";
import { BlankStack } from "@/layouts/blank-stack";
import { Stack } from "@/layouts/stack";

export default function ActivityProbeLayout() {
	const stackType = useResolvedStackType();
	const StackNavigator = stackType === "native-stack" ? Stack : BlankStack;
	const navigatorScreenOptions =
		stackType === "native-stack" ? { enableTransitions: true } : undefined;

	const createSheetOptions = (): BlankStackNavigationOptions => ({
		gestureEnabled: true,
		gestureDirection: "vertical" as const,

		transitionSpec: {
			open: Transition.Specs.DefaultSpec,
			close: Transition.Specs.DefaultSpec,
		},
		screenStyleInterpolator: ({
			layouts: {
				screen: { height },
			},
			progress,
		}) => {
			"worklet";
			const y = interpolate(progress, [0, 1], [height * 0.65, 0], "clamp");
			const scale = interpolate(progress, [1, 2], [1, 0.96], "clamp");
			const overlayOpacity = interpolate(progress, [0, 1], [0, 0.35], "clamp");

			return {
				content: {
					style: {
						transform: [{ translateY: y }, { scale }],
					},
				},
				backdrop: {
					style: {
						backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
					},
				},
			};
		},
	});

	return (
		<StackNavigator screenOptions={navigatorScreenOptions}>
			<StackNavigator.Screen
				name="index"
				options={{
					inactiveBehavior: "pause",
				}}
			/>
			<StackNavigator.Screen
				name="inert-sheet"
				options={createSheetOptions()}
			/>
			<StackNavigator.Screen
				name="pause-cover"
				options={createSheetOptions()}
			/>
		</StackNavigator>
	);
}
