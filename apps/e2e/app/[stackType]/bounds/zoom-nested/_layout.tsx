// @ts-nocheck
import { interpolate } from "react-native-reanimated";
import type { ScreenTransitionConfig } from "react-native-screen-transitions";
import Transition from "react-native-screen-transitions";
import { useResolvedStackType } from "@/components/stack-examples/stack-routing";
import { BlankStack } from "@/layouts/blank-stack";
import { Stack } from "@/layouts/stack";
import { activeNestedZoomGroupId, NESTED_ZOOM_GROUP } from "./constants";

const nestedZoomInterpolator: ScreenTransitionConfig["screenStyleInterpolator"] =
	({ bounds, progress }) => {
		"worklet";
		const id = activeNestedZoomGroupId.value;

		if (!id) {
			return {};
		}

		const navigationStyles = bounds({
			id,
			group: NESTED_ZOOM_GROUP,
			target: "bound",
		}).navigation.zoom();

		return {
			...navigationStyles,
			backdrop: {
				backgroundColor: "black",
				opacity: interpolate(progress, [0, 1, 2], [0, 0.55, 0]),
			},
		};
	};

export default function NestedNavigationZoomGroupLayout() {
	const stackType = useResolvedStackType();
	const StackNavigator = stackType === "native-stack" ? Stack : BlankStack;
	const navigatorScreenOptions =
		stackType === "native-stack" ? { enableTransitions: true } : undefined;

	return (
		<StackNavigator screenOptions={navigatorScreenOptions}>
			<StackNavigator.Screen name="index" />
			<StackNavigator.Screen
				name="[id]/index"
				options={{
					navigationMaskEnabled: Platform.OS === "ios",
					gestureEnabled: true,
					gestureDirection: ["vertical", "vertical-inverted", "horizontal"],
					gestureReleaseVelocityScale: 1.6,
					gestureDrivesProgress: false,
					screenStyleInterpolator: nestedZoomInterpolator,
					experimental_enableHighRefreshRate: true,
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.FlingSpec,
					},
				}}
			/>
			<StackNavigator.Screen
				name="[id]/plan"
				options={{
					screenStyleInterpolator: ({
						progress,
						layouts: {
							screen: { width },
						},
					}) => {
						"worklet";
						const x = interpolate(progress, [0, 1, 2], [width, 0, -width]);
						return {
							content: {
								style: { transform: [{ translateX: x }] },
							},
						};
					},
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.FlingSpec,
					},
				}}
			/>
		</StackNavigator>
	);
}
