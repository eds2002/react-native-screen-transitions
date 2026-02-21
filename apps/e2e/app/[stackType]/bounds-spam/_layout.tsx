// @ts-nocheck
import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";
import { Stack } from "@/layouts/stack";
import { useResolvedStackType } from "@/components/stack-examples/stack-routing";

const getRouteBoundaryId = (route: { params?: object }) => {
	"worklet";
	const params = route.params as Record<string, unknown> | undefined;
	const rawId = params?.id;
	return typeof rawId === "string" ? rawId : null;
};

export default function BoundsSpamLayout() {
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
					screenStyleInterpolator: ({ bounds, progress, current, active }) => {
						"worklet";
						const boundaryId =
							getRouteBoundaryId(current.route) ??
							getRouteBoundaryId(active.route);

						if (boundaryId) {
							return {
								[boundaryId]: {
									...bounds({ id: boundaryId }),
								},
							};
						}

						return {
							contentStyle: {
								transform: [
									{
										scale: interpolate(progress, [1, 2], [1, 0.95], "clamp"),
									},
								],
							},
						};
					},
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.DefaultSpec,
					},
				}}
			/>
		</StackNavigator>
	);
}
