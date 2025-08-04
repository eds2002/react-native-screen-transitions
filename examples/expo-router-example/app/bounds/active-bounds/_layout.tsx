import { Easing, interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { Stack } from "@/layouts/stack";

export default function ActiveBoundsLayout() {
	return (
		<Stack>
			<Stack.Screen
				name="index"
				options={{ title: "Active Bounds", headerShown: false }}
			/>
			<Stack.Screen
				name="[id]"
				options={{
					gestureEnabled: true,
					gestureDirection: ["bidirectional"],
					gestureDrivesProgress: false,
					enableTransitions: true,
					screenStyleInterpolator: ({
						bounds,
						progress,

						layouts: {
							screen: { width, height },
						},
						focused,
						activeBoundId,
					}) => {
						"worklet";

						if (!activeBoundId) return {};

						if (focused) {
							const prev = bounds.get("previous", activeBoundId);
							const dx =
								prev.bounds.pageX - 0 + (prev.bounds.width - width) / 2;
							const dy =
								prev.bounds.pageY - 0 + (prev.bounds.height - height) / 2;

							const targetWidth = width * 0.9;
							const targetHeight = targetWidth;

							const animatedWidth = interpolate(
								progress,
								[0, 1],
								[prev.bounds.width, targetWidth],
							);
							const animatedHeight = interpolate(
								progress,
								[0, 1],
								[prev.bounds.height, targetHeight],
							);
							const animatedX = interpolate(progress, [0, 1], [dx, 0]);
							const animatedY = interpolate(progress, [0, 1], [dy, 0]);

							return {
								[activeBoundId]: {
									width: animatedWidth,
									height: animatedHeight,
									transform: [
										{ translateX: animatedX },
										{ translateY: animatedY },
									],
									overflow: "hidden",
									backgroundColor: prev.styles.backgroundColor,
								},
								overlayStyle: {
									backgroundColor: "#FFF",
									opacity: interpolate(progress, [0, 1], [0, 0.5]),
								},
							};
						}

						return {
							contentStyle: {
								transform: [
									{
										scale: interpolate(progress, [1, 2], [1, 0.95]),
									},
								],
							},
						};
					},
					transitionSpec: {
						open: Transition.specs.DefaultSpec,
						close: {
							duration: 1000,
							easing: Easing.bezierFn(0.19, 1, 0.22, 1),
						},
					},
				}}
			/>
		</Stack>
	);
}
