import { Platform } from "react-native";
import { interpolate } from "react-native-reanimated";
import type { ScreenTransitionConfig } from "react-native-screen-transitions";
import { useResolvedStackType } from "@/components/stack-examples/stack-routing";
import { BlankStack } from "@/layouts/blank-stack";
import { Stack } from "@/layouts/stack";
import { REELS_GROUP, selectedId } from "./constants";

const reelsInterpolator: ScreenTransitionConfig["screenStyleInterpolator"] = ({
	bounds,
}) => {
	"worklet";
	const id = selectedId.value;

	if (!id) {
		return null;
	}

	const zoomAnimation = bounds({
		id,
		group: REELS_GROUP,
	}).navigation.zoom({
		verticalDragScale: [0.96, 1.01, 2],
		horizontalDragScale: [0.92, 1.02, 2],
		borderRadius: 48,
		target: "bound",
		backgroundScale: 1,
	});

	return zoomAnimation;
};

export default function ReelsLayout() {
	const stackType = useResolvedStackType();
	const StackNavigator = stackType === "native-stack" ? Stack : BlankStack;
	const navigatorScreenOptions =
		stackType === "native-stack" ? { enableTransitions: true } : undefined;

	return (
		<StackNavigator screenOptions={navigatorScreenOptions}>
			<StackNavigator.Screen name="index" />
			<StackNavigator.Screen
				name="reel"
				options={{
					navigationMaskEnabled: Platform.OS === "ios",
					gestureEnabled: true,
					gestureDirection: ["horizontal", "vertical", "vertical-inverted"],
					gestureDrivesProgress: false,
					screenStyleInterpolator: reelsInterpolator,
					experimental_enableHighRefreshRate: true,
					transitionSpec: {
						open: {
							stiffness: 1000,
							damping: 300,
							mass: 3,
							overshootClamping: true,
							// @ts-expect-error
							restSpeedThreshold: 0.02,
						},
						close: {
							stiffness: 1000,
							damping: 300,
							mass: 3,
							overshootClamping: false,
							// @ts-expect-error
							restSpeedThreshold: 0.02,
						},
					},
				}}
			/>
		</StackNavigator>
	);
}
