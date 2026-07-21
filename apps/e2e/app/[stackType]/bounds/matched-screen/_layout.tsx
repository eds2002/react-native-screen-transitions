import type { ScreenTransitionConfig } from "react-native-screen-transitions";
import Transition from "react-native-screen-transitions";
import { useResolvedStackType } from "@/components/stack-examples/stack-routing";
import { BlankStack } from "@/layouts/blank-stack";
import { Stack } from "@/layouts/stack";
import { MATCHED_SCREEN_BOUNDARY_GROUP } from "./constants";

function getBoundaryId(route: { params?: object } | undefined) {
	"worklet";
	const id = (route?.params as { id?: unknown } | undefined)?.id;
	return typeof id === "string" ? id : "";
}

const navigationZoomInterpolator: ScreenTransitionConfig["screenStyleInterpolator"] =
	({ active, bounds, current, next }) => {
		"worklet";
		const id =
			getBoundaryId(active.route) ||
			getBoundaryId(next?.route) ||
			getBoundaryId(current.route);

		return id
			? bounds({
					group: MATCHED_SCREEN_BOUNDARY_GROUP,
					id,
				}).navigation.zoom({
					keepFocusedVisible: true,
					target: "bound",
				})
			: {};
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
