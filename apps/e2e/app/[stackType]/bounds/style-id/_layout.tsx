import { BlurView } from "expo-blur";
import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { useResolvedStackType } from "@/components/stack-examples/stack-routing";
import { BlankStack } from "@/layouts/blank-stack";
import { Stack } from "@/layouts/stack";
import { STYLE_ID_GROUP, type StyleIdMode } from "./constants";

const getRouteParam = (route: { params?: object } | undefined, key: string) => {
	"worklet";
	const params = route?.params as Record<string, unknown> | undefined;
	const value = params?.[key];
	return typeof value === "string" ? value : "";
};

const getRouteModeParam = (
	route: { params?: object } | undefined,
): StyleIdMode | "" => {
	"worklet";
	const mode = getRouteParam(route, "mode");
	if (mode === "single" || mode === "group") return mode;
	return "";
};

export default function StyleIdBoundsLayout() {
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
					navigationMaskEnabled: true,
					gestureEnabled: true,
					gestureDirection: ["vertical", "horizontal", "vertical-inverted"],
					backdropComponent: BlurView,
					screenStyleInterpolator: ({
						current,
						bounds,
						focused,
						next,
						active,
					}) => {
						"worklet";
						const boundTag =
							getRouteParam(active.route, "id") ||
							getRouteParam(next?.route, "id") ||
							getRouteParam(current.route, "id");
						const mode =
							getRouteModeParam(active.route) ||
							getRouteModeParam(next?.route) ||
							getRouteModeParam(current.route) ||
							"group";

						if (!boundTag) {
							return {};
						}

						const revealStyles = bounds({
							id: boundTag,
							group: mode === "group" ? STYLE_ID_GROUP : undefined,
						}).navigation.containerReveal();

						if (focused) {
							return {
								...revealStyles,
								backdrop: {
									props: {
										intensity: interpolate(
											active.progress - active.gesture.normY,
											[0, 1],
											[0, 50],
										),
									},
								},
							};
						}

						return revealStyles;
					},
					transitionSpec: {
						open: {
							stiffness: 750,
							damping: 1000,
							mass: 3,
							overshootClamping: false,
						},
						close: { ...Transition.Specs.DefaultSpec, mass: 2 },
					},
				}}
			/>
		</StackNavigator>
	);
}
