import { Easing } from "react-native-reanimated";
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
					screenStyleInterpolator: ({
						bounds,
						progress,
						interpolate,
						isFocused,
					}) => {
						"worklet";

						if (isFocused && bounds.activeTag) {
							const start = bounds.get(bounds.activeTag, "previous");
							const end = bounds.get(bounds.activeTag, "current");

							if (!start || !end) return {};

							const { translateX, translateY, scaleX, scaleY } =
								bounds.interpolateBounds(start, end, progress);

							return {
								[start.id]: {
									transform: [
										{ translateX },
										{ translateY },
										{ scaleX },
										{ scaleY },
									],
									opacity: interpolate([0, 1], [0, 1]),
									borderRadius: interpolate([0, 1], [24, 12]),
									overflow: "hidden",
								},
								overlayStyle: {
									backgroundColor: "#000",
									opacity: interpolate([0, 1], [0, 0.25]),
								},
							};
						}

						if (!bounds.activeTag) return {};

						const start = bounds.get(bounds.activeTag, "current");
						const end = bounds.get(bounds.activeTag, "next");

						if (!start || !end) return {};

						const { translateX, translateY, scaleX, scaleY } =
							bounds.interpolateBounds(start, end, progress);

						return {
							contentStyle: {
								transform: [
									{
										scale: interpolate([1, 2], [1, 0.9]),
									},
								],
							},
							[start.id]: {
								transform: [
									{ translateX },
									{ translateY },
									{ scaleX },
									{ scaleY },
								],
								opacity: interpolate([1, 2], [1, 0]),
							},
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
