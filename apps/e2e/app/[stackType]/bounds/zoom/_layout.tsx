import { Platform } from "react-native";
import { interpolate } from "react-native-reanimated";
import type { ScreenTransitionConfig } from "react-native-screen-transitions";
import Transition from "react-native-screen-transitions";
import { useResolvedStackType } from "@/components/stack-examples/stack-routing";
import { BlankStack } from "@/layouts/blank-stack";
import { Stack } from "@/layouts/stack";
import { ZOOM_GROUP, type ZoomExampleMode } from "./constants";

const getRouteParam = (route: { params?: object } | undefined, key: string) => {
	"worklet";
	const params = route?.params as Record<string, unknown> | undefined;
	const value = params?.[key];
	return typeof value === "string" ? value : "";
};

const getRouteModeParam = (
	route: { params?: object } | undefined,
): ZoomExampleMode | "" => {
	"worklet";
	const mode = getRouteParam(route, "mode");
	if (mode === "single" || mode === "group") return mode;
	return "";
};

const navigationZoomInterpolator: ScreenTransitionConfig["screenStyleInterpolator"] =
	({ active, bounds, current, next, progress }) => {
		"worklet";
		const id =
			getRouteParam(active.route, "id") ||
			getRouteParam(next?.route, "id") ||
			getRouteParam(current.route, "id");
		const mode =
			getRouteModeParam(active.route) ||
			getRouteModeParam(next?.route) ||
			getRouteModeParam(current.route) ||
			"group";

		if (!id) {
			return {};
		}

		const navigationStyles = bounds({
			id,
			group: mode === "group" ? ZOOM_GROUP : undefined,
		}).navigation.zoom({ target: "bound" });

		return {
			...navigationStyles,
			backdrop: {
				backgroundColor: "black",
				opacity: interpolate(progress, [0, 1, 2], [0, 0.5, 0]),
			},
		};
	};

export default function NavigationZoomGroupTransitionsLayout() {
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
					navigationMaskEnabled: Platform.OS === "ios",
					gestureEnabled: true,
					gestureDirection: ["vertical", "vertical-inverted", "horizontal"],
					gestureReleaseVelocityScale: 2,
					gestureDrivesProgress: false,
					screenStyleInterpolator: navigationZoomInterpolator,
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.FlingSpec,
					},
				}}
			/>
		</StackNavigator>
	);
}
