import { Platform } from "react-native";
import { interpolate, interpolateColor } from "react-native-reanimated";
import type { ScreenTransitionConfig } from "react-native-screen-transitions";
import Transition from "react-native-screen-transitions";
import { useResolvedStackType } from "@/components/stack-examples/stack-routing";
import { BlankStack } from "@/layouts/blank-stack";
import { Stack } from "@/layouts/stack";
import {
	activeHorizontalGalleryId,
	HORIZONTAL_GALLERY_GROUP,
} from "./constants";

const horizontalGalleryZoomInterpolator: ScreenTransitionConfig["screenStyleInterpolator"] =
	({ bounds, focused, progress }) => {
		"worklet";
		const id = activeHorizontalGalleryId.value;

		if (!id) {
			return {};
		}

		const navigationStyles = bounds({
			id,
			group: HORIZONTAL_GALLERY_GROUP,
		}).navigation.zoom({ target: "bound" });

		const backdropColor = interpolateColor(
			progress - Math.abs(progress - 1),
			[0, 1],
			["rgba(0,0,0,0)", "rgba(0,0,0,1)"],
		);

		return {
			...navigationStyles,
			backdrop: focused
				? {
						backgroundColor: backdropColor,
					}
				: {},
		};
	};

export default function HorizontalGalleryLayout() {
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
					navigationMaskEnabled: Platform.OS === "ios",
					gestureEnabled: true,
					gestureDirection: ["vertical", "vertical-inverted"],
					gestureReleaseVelocityScale: 1.6,
					gestureDrivesProgress: false,
					screenStyleInterpolator: horizontalGalleryZoomInterpolator,
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
