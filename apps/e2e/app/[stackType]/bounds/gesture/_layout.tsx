// @ts-nocheck
import { withTiming } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { useResolvedStackType } from "@/components/stack-examples/stack-routing";
import { BlankStack } from "@/layouts/blank-stack";
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
								opacity: withTiming(current.gesture.dragging ? 0.5 : 1),
							},
						};
					},
					transitionSpec: {
						open: { ...Transition.Specs.DefaultSpec, mass: 10 },
						close: { ...Transition.Specs.DefaultSpec, mass: 10 },
					},
				}}
			/>
		</StackNavigator>
	);
}
