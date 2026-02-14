import { withTiming } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { Stack } from "@/layouts/stack";

const toGestureBoundaryId = (route: { params?: object }) => {
	"worklet";
	const params = route.params as Record<string, unknown> | undefined;
	const rawId = params?.id;

	if (typeof rawId !== "string") {
		return null;
	}

	return rawId.startsWith("gesture-bounds-")
		? rawId
		: `gesture-bounds-${rawId}`;
};

export default function GestureBoundsLayout() {
	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen name="index" />
			<Stack.Screen
				name="[id]"
				options={{
					enableTransitions: true,
					gestureEnabled: true,
					gestureDirection: ["vertical"],
					gestureDrivesProgress: false,
					screenStyleInterpolator: ({ bounds, current, active }) => {
						"worklet";
						const currentTag = toGestureBoundaryId(current.route);
						const activeTag = toGestureBoundaryId(active.route);
						const boundTag = currentTag ?? activeTag;

						if (!boundTag) {
							return {};
						}

						const boundStyles = bounds({
							id: boundTag,
							gestures: {
								x: active.gesture.x,
								y: active.gesture.y,
							},
							target: "fullscreen",
						});

						return {
							[boundTag]: {
								...boundStyles,
								opacity: withTiming(current.gesture.isDragging ? 0.5 : 1),
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
