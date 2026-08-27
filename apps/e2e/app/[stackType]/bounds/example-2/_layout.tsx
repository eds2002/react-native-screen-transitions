import Transition from "react-native-screen-transitions";
import { useResolvedStackType } from "@/components/stack-examples/stack-routing";
import { BlankStack } from "@/layouts/blank-stack";
import { Stack } from "@/layouts/stack";
import { nestedBoundaryZoomInterpolator } from "../nested-boundary-example";

export default function NestedDestinationExampleLayout() {
	const stackType = useResolvedStackType();
	const StackNavigator = stackType === "native-stack" ? Stack : BlankStack;
	const screenOptions =
		stackType === "native-stack" ? { enableTransitions: true } : undefined;

	return (
		<StackNavigator screenOptions={screenOptions}>
			<StackNavigator.Screen name="source" />
			<StackNavigator.Screen
				name="nested"
				options={{
					gestureEnabled: true,
					gestureDirection: ["bidirectional", "pinch-in"],
					gestureProgressMode: "freeform",
					gestureReleaseVelocityScale: 1.6,
					navigationMaskEnabled: true,
					screenStyleInterpolator: nestedBoundaryZoomInterpolator,
					transitionSpec: Transition.Specs.Zoom,
				}}
			/>
		</StackNavigator>
	);
}
