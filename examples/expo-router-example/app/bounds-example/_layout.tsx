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
						previous,
						current,
						next,
						utils: { interpolate, isFocused },
					}) => {
						"worklet";

						if (
							isFocused &&
							previous?.bounds?.value &&
							current?.bounds?.value
						) {
							const startBounds = previous?.bounds?.value;
							const endBounds = current?.bounds?.value;
							const s = startBounds;
							const e = endBounds;
							if (!s || !e) return {};

							const dx = s.pageX - e.pageX + (s.width - e.width) / 2;
							const dy = s.pageY - e.pageY + (s.height - e.height) / 2;

							const animatedStyle = {
								transform: [
									{ translateX: interpolate([0, 1], [dx, 0]) },
									{ translateY: interpolate([0, 1], [dy, 0]) },
									{ scaleX: interpolate([0, 1], [s.width / e.width, 1]) },
									{ scaleY: interpolate([0, 1], [s.height / e.height, 1]) },
								],
								opacity: interpolate([0, 1], [0, 1]),
								borderRadius: interpolate([0, 1], [24, 12]),
							};

              // Focused screen animations
							return {
								boundStyle: {
									[startBounds.id]: animatedStyle,
								},
								overlayStyle: {
									backgroundColor: "#000",
									opacity: interpolate([0, 1], [0, 0.25]),
								},
							};
						}
						if (!isFocused && current?.bounds?.value && next?.bounds?.value) {
							const startBounds = current?.bounds?.value;
							const endBounds = next?.bounds?.value;
							const s = startBounds;
							const e = endBounds;
							if (!s || !e) return {};

							const dx = e.pageX - s.pageX + (e.width - s.width) / 2;
							const dy = e.pageY - s.pageY + (e.height - s.height) / 2;

							const animatedStyle = {
								transform: [
									{ translateX: interpolate([1, 2], [0, dx]) },
									{ translateY: interpolate([1, 2], [0, dy]) },
									{ scaleX: interpolate([1, 2], [1, e.width / s.width]) },
									{ scaleY: interpolate([1, 2], [1, e.height / s.height]) },
								],
								opacity: interpolate([1, 2], [1, 0]),
							};

							return {
								boundStyle: {
									[startBounds.id]: animatedStyle,
								},
								contentStyle: {
									transform: [
										{
											scale: interpolate([1, 2], [1, 0.9]),
										},
									],
								},
							};
						}

						return {};
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
