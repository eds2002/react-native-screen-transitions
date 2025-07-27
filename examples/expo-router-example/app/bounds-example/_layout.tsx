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

						layouts: { screen },
					}) => {
						"worklet";

						if (isFocused && bounds.activeTag) {
							const start = bounds.get(bounds.activeTag, "previous");
							const end = bounds.get(bounds.activeTag, "current");

							if (!start || !end) return {};

							const { transform } = bounds.interpolate([0, 1], start, end);

							return {
								[bounds.activeTag]: {
									transform,
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
									opacity: interpolate(progress, [0, 1], [0, 0.9]),
								},
							};
						}

						if (!bounds.activeTag) return {};

						const start = bounds.get(bounds.activeTag, "current");
						const end = bounds.get(bounds.activeTag, "next");

						if (!start || !end) return {};

						const { transform } = bounds.interpolate([1, 2], start, end, true);

						const boundsStyle = {
							transform,
							opacity: interpolate(progress, [1, 1.5], [1, 0]),
						};

						return {
							contentStyle: {
								transform: [
									{
										scale: interpolate(progress, [1, 2], [1, 0.75]),
									},
								],
							},
							[bounds.activeTag]: boundsStyle,
						};
					},
					transitionSpec: {
						open: Transition.specs.DefaultSpec,
						close: {
							duration: 600,
							easing: Easing.bezierFn(0.19, 1, 0.22, 1),
						},
					},
				}}
			/>
		</Stack>
	);
}
