import type { ScreenTransitionConfig } from "react-native-screen-transitions";
import Transition from "react-native-screen-transitions";
import { useResolvedStackType } from "@/components/stack-examples/stack-routing";
import { BlankStack } from "@/layouts/blank-stack";
import { Stack } from "@/layouts/stack";
import { CARRIED_HANDOFF_ID, type MatchedScreenHandoffMode } from "./constants";

function getRouteParam(route: { params?: object } | undefined, key: string) {
	"worklet";
	const params = route?.params as Record<string, unknown> | undefined;
	const value = params?.[key];
	return typeof value === "string" ? value : "";
}

const navigationZoomInterpolator: ScreenTransitionConfig["screenStyleInterpolator"] =
	({ active, bounds, current, focused, next }) => {
		"worklet";
		const id =
			getRouteParam(active.route, "id") ||
			getRouteParam(next?.route, "id") ||
			getRouteParam(current.route, "id");

		if (!id) {
			return {};
		}

		if (!focused) {
			return null;
		}

		const navigationStyles = bounds(id).navigation.zoom({
			keepFocusedVisible: true,
			target: "bound",
		});
		const handoffMode = (getRouteParam(active.route, "handoffMode") ||
			getRouteParam(next?.route, "handoffMode") ||
			getRouteParam(current.route, "handoffMode")) as
			| MatchedScreenHandoffMode
			| "";

		if (handoffMode !== "explicit") {
			return navigationStyles;
		}

		const boundarySlot = navigationStyles[id];

		if (!boundarySlot) {
			return navigationStyles;
		}

		return {
			...navigationStyles,
			[id]: {
				...boundarySlot,
				props: {
					handoffTarget:
						active.closing &&
						active.progress <= (id === CARRIED_HANDOFF_ID ? 0.3 : 0.5)
							? "source"
							: "destination",
				},
			},
		};
	};

export default function MatchedScreenLayout() {
	const stackType = useResolvedStackType();
	const StackNavigator = stackType === "native-stack" ? Stack : BlankStack;
	const navigatorScreenOptions =
		stackType === "native-stack" ? { enableTransitions: true } : undefined;

	return (
		<StackNavigator screenOptions={navigatorScreenOptions}>
			<StackNavigator.Screen name="index" />
			<StackNavigator.Screen
				name="player"
				options={{
					gestureEnabled: true,
					gestureDirection: ["bidirectional", "pinch-in"],
					navigationMaskEnabled: true,
					screenStyleInterpolator: navigationZoomInterpolator,
					transitionSpec: Transition.Specs.Zoom,
				}}
			/>
		</StackNavigator>
	);
}
