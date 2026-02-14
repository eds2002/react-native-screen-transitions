import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { Stack } from "@/layouts/stack";

const getRouteBoundaryId = (route: { params?: object }) => {
	"worklet";
	const params = route.params as Record<string, unknown> | undefined;
	const rawId = params?.id;
	return typeof rawId === "string" ? rawId : null;
};

export default function ActiveBoundsLayout() {
	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen name="index" />
			<Stack.Screen
				name="[id]"
				options={{
					enableTransitions: true,
					gestureEnabled: true,
					gestureDirection: ["bidirectional"],
					gestureDrivesProgress: false,
					screenStyleInterpolator: ({ bounds, progress, current }) => {
						"worklet";
						const boundaryId = getRouteBoundaryId(current.route);

						if (boundaryId) {
							return {
								[boundaryId]: bounds({
									id: boundaryId,
								}),
							};
						}

						const scale = interpolate(progress, [1, 2], [1, 0.95]);
						return {
							contentStyle: {
								transform: [{ scale }],
							},
						};
					},
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.DefaultSpec,
					},
				}}
			/>
		</Stack>
	);
}
