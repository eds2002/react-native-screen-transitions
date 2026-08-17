import type { ScreenTransitionConfig } from "react-native-screen-transitions";
import Transition from "react-native-screen-transitions";
import { useResolvedStackType } from "@/components/stack-examples/stack-routing";
import { BlankStack } from "@/layouts/blank-stack";
import { Stack } from "@/layouts/stack";

const getRouteBoundaryId = (route: { params?: object } | undefined) => {
	"worklet";
	const params = route?.params as { id?: unknown } | undefined;
	return typeof params?.id === "string" ? params.id : "";
};

const stackingInterpolator: ScreenTransitionConfig["screenStyleInterpolator"] =
	({ active, bounds, current, next, previous }) => {
		"worklet";
		const id =
			getRouteBoundaryId(active.route) ||
			getRouteBoundaryId(next?.route) ||
			getRouteBoundaryId(previous?.route) ||
			getRouteBoundaryId(current.route);

		if (!id) return {};

		return bounds(id).navigation.zoom();
	};

export default function StackingBoundsLayout() {
	const stackType = useResolvedStackType();
	const StackNavigator = stackType === "native-stack" ? Stack : BlankStack;
	const navigatorScreenOptions =
		stackType === "native-stack" ? { enableTransitions: true } : undefined;

	return (
		<StackNavigator screenOptions={navigatorScreenOptions as never}>
			<StackNavigator.Screen
				name="index"
				options={({ route }) =>
					getRouteBoundaryId(route)
						? {
								backdropBehavior: "dismiss",
								gestureDirection: ["bidirectional", "pinch-in"],
								gestureEnabled: true,
								navigationMaskEnabled: true,
								screenStyleInterpolator: stackingInterpolator,
								transitionSpec: Transition.Specs.Zoom,
							}
						: {}
				}
			/>
			<StackNavigator.Screen
				name="[id]"
				options={{
					backdropBehavior: "dismiss",
					gestureDirection: ["bidirectional", "pinch-in"],
					gestureEnabled: true,
					navigationMaskEnabled: true,
					screenStyleInterpolator: stackingInterpolator,
					transitionSpec: Transition.Specs.Zoom,
				}}
			/>
		</StackNavigator>
	);
}
