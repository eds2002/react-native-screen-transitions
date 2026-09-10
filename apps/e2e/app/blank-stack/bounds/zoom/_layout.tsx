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
	({ active, bounds, current, next }) => {
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
		}).navigation.zoom({ target: "bound" });

		return {
			...navigationStyles,
			backdrop: {
				backgroundColor: "black",
				opacity: interpolate(active.transitionProgress, [0, 1, 2], [0, 0.5, 0]),
			},
		};
	};

export default function NavigationZoomGroupTransitionsLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen
				name="[id]"
				options={{
					navigationMaskEnabled: true,
					backdropBehavior: "dismiss",
					gestureEnabled: true,
					gestureDirection: ["bidirectional", "pinch-in"],
					gestureReleaseVelocityScale: 1.6,
					screenStyleInterpolator: navigationZoomInterpolator,
					transitionSpec: Transition.Specs.Zoom,
				}}
			/>
		</BlankStack>
	);
}
