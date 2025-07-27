import { Easing, interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { Stack } from "@/layouts/stack";

export default function BoundsExampleLayout() {
	return (
		<Stack>
			<Stack.Screen
				name="index"
				options={{
					skipDefaultScreenOptions: true,
					headerShown: false,
				}}
			/>
			<Stack.Screen
				name="[id]"
				options={{
					title: "B",
					gestureEnabled: true,
					gestureDirection: ["bidirectional"],
					gestureDrivesProgress: false,
					screenStyleInterpolator: ({
						bounds,
						current,
						isFocused,
						progress,
						next,
						layouts: { screen },
					}) => {
						"worklet";

						// Calculate consistent gesture offsets for both bounds (applied below)

						const MAX_DRAG_MULTIPLIER = 0.9;

						if (isFocused && bounds.activeTag) {
							const gestureX = interpolate(
								current.gesture.normalizedX.value,
								[-1, 1],
								[
									-screen.width * MAX_DRAG_MULTIPLIER,
									screen.width * MAX_DRAG_MULTIPLIER,
								],
								"clamp",
							);
							console.log("Focused gesture:", gestureX);

							const gestureY = interpolate(
								current.gesture.normalizedY.value,
								[-1, 1],
								[
									-screen.height * MAX_DRAG_MULTIPLIER,
									screen.height * MAX_DRAG_MULTIPLIER,
								],
								"clamp",
							);

							const start = bounds.get(bounds.activeTag, "previous");
							const end = bounds.get(bounds.activeTag, "current");

							if (!start || !end) return {};

							const { transform } = bounds.interpolate([0, 1], start, end);

							return {
								[bounds.activeTag]: {
									transform: [
										{ translateX: gestureX },
										{ translateY: gestureY },
										...(transform as any),
									],
									borderTopLeftRadius: interpolate(progress, [0, 1], [100, 50]),
									borderTopRightRadius: interpolate(
										progress,
										[0, 1],
										[100, 50],
									),
									borderBottomLeftRadius: interpolate(
										progress,
										[0, 1],
										[100, 50],
									),
									borderBottomRightRadius: interpolate(
										progress,
										[0, 1],
										[100, 50],
									),
									overflow: "hidden",
								},
								overlayStyle: {
									backgroundColor: "#FFF",
									opacity: interpolate(progress, [0, 1], [0, 0.5]),
								},
							};
						}
						if (!isFocused && next) {
							const gestureX = interpolate(
								next?.gesture.normalizedX.value ?? 0,
								[-1, 1],
								[
									-screen.width * MAX_DRAG_MULTIPLIER,
									screen.width * MAX_DRAG_MULTIPLIER,
								],
								"clamp",
							);

							const gestureY = interpolate(
								next?.gesture.normalizedY.value ?? 0,
								[-1, 1],
								[
									-screen.height * MAX_DRAG_MULTIPLIER,
									screen.height * MAX_DRAG_MULTIPLIER,
								],
								"clamp",
							);

							if (!bounds.activeTag) return {};

							const start = bounds.get(bounds.activeTag, "current");
							const end = bounds.get(bounds.activeTag, "next");

							if (!start || !end) return {};

							const { transform } = bounds.interpolate(
								[1, 2],
								start,
								end,
								true,
							);

							const boundsStyle = {
								transform: [
									{ translateX: gestureX },
									{ translateY: gestureY },
									...(transform as any),
								],
								opacity: interpolate(progress, [1, 1.5], [1, 0]),
							};

							return {
								contentStyle: {
									transform: [
										{
											scale: interpolate(progress, [1, 2], [1, 0.95]),
										},
									],
								},
								[bounds.activeTag]: boundsStyle,
							};
						}

						return {};
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
