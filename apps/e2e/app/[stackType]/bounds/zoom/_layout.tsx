// @ts-nocheck
import { interpolate } from "react-native-reanimated";
import type { ScreenTransitionConfig } from "react-native-screen-transitions";
import Transition from "react-native-screen-transitions";
import {
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { BlankStack } from "@/layouts/blank-stack";
import { Stack } from "@/layouts/stack";
import { activeZoomId, ZOOM_GROUP } from "./constants";

const navigationZoomInterpolator: ScreenTransitionConfig["screenStyleInterpolator"] =
	({ bounds, progress }) => {
		"worklet";
		const id = activeZoomId.value;

		if (!id) {
			return {};
		}

		const navigationStyles = bounds({
			id,
			group: ZOOM_GROUP,
			target: "bound",
		}).navigation.zoom();

		return {
			...navigationStyles,
			backdrop: {
				backgroundColor: "black",
				opacity: interpolate(progress, [0, 1, 2], [0, 0.5, 0]),
			},
		};
	};

export default function NavigationZoomGroupTransitionsLayout() {
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
					maskEnabled: true,
					gestureEnabled: true,
					gestureDirection: ["vertical", "vertical-inverted", "horizontal"],
					gestureReleaseVelocityScale: 1.6,
					gestureDrivesProgress: false,
					screenStyleInterpolator: navigationZoomInterpolator,
					experimental_enableHighRefreshRate: true,
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.FlingSpec,
					},
				}}
			/>
		</StackNavigator>
	);
}
