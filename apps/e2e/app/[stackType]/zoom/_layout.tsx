// @ts-nocheck
import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";
import { Stack } from "@/layouts/stack";
import { useResolvedStackType } from "@/components/stack-examples/stack-routing";

const toZoomId = (route: { params?: object }) => {
	"worklet";
	const params = route.params as Record<string, unknown> | undefined;
	const rawId = params?.id;

	if (typeof rawId !== "string") {
		return null;
	}

	return rawId;
};

export default function ZoomLayout() {
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
					gestureDirection: ["vertical", "vertical-inverted", "horizontal"],
					gestureDrivesProgress: false,
					screenStyleInterpolator: ({ bounds, current, active, progress }) => {
						"worklet";

						const currentId = toZoomId(current.route);
						const activeId = toZoomId(active.route);
						const id = currentId ?? activeId;

						if (!id) {
							return {};
						}

						const navigationStyles = bounds({
							id,
							scaleMode: "uniform",
						}).navigation.zoom();

						return {
							...navigationStyles,
							overlayStyle: {
								backgroundColor: "black",
								opacity: interpolate(progress, [0, 1, 2], [0, 0.5, 0]),
							},
						};
					},
					transitionSpec: {
						open: Transition.Specs.IOSZoomSpec,
						close: Transition.Specs.IOSZoomSpec,
					},
				}}
			/>
		</StackNavigator>
	);
}
