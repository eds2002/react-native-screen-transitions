import { interpolate } from "react-native-reanimated";
import type { ScreenTransitionConfig } from "react-native-screen-transitions";
import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";
import { ZOOM_GROUP } from "./constants";

const getRouteParam = (route: { params?: object } | undefined, key: string) => {
	"worklet";
	const params = route?.params as Record<string, unknown> | undefined;
	const value = params?.[key];
	return typeof value === "string" ? value : "";
};

const navigationZoomInterpolator: ScreenTransitionConfig["screenStyleInterpolator"] =
	({ active, bounds, current, next, progress }) => {
		"worklet";
		const id =
			getRouteParam(active.route, "id") ||
			getRouteParam(next?.route, "id") ||
			getRouteParam(current.route, "id");

		if (!id) {
			return {};
		}

		const navigationStyles = bounds({
			id,
			group: ZOOM_GROUP,
		}).navigation.zoom();

		return {
			...navigationStyles,
			backdrop: {
				backgroundColor: "black",
				opacity: interpolate(progress, [0, 1, 2], [0, 0.5, 0]),
			},
		};
	};

export default function NavigationZoomGroupTransitionsLayout() {
	const StackNavigator = BlankStack;

	return (
		<StackNavigator>
			<StackNavigator.Screen name="index" />
			<StackNavigator.Screen
				name="[id]"
				options={{
					// navigationMaskEnabled: Platform.OS === "ios",
					gestureEnabled: true,
					gestureDirection: ["bidirectional"],
					// gestureReleaseVelocityScale: 1.6,
					gestureProgressMode: "freeform",
					screenStyleInterpolator: navigationZoomInterpolator,
					experimental_enableHighRefreshRate: true,
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.FlingSpec,
					},
				}}
			/>
		</StackNavigator>
	);
}
