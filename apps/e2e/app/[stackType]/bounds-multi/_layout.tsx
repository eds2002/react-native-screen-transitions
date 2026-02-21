// @ts-nocheck
import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";
import { Stack } from "@/layouts/stack";
import { useResolvedStackType } from "@/components/stack-examples/stack-routing";

const getRouteId = (route: { params?: object }) => {
	"worklet";
	const params = route.params as Record<string, unknown> | undefined;
	return typeof params?.id === "string" ? params.id : null;
};

export default function BoundsMultiLayout() {
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
						const itemId =
							getRouteId(current.route) ?? getRouteId(active.route);

						if (itemId) {
							const imgTag = `multi-img-${itemId}`;
							const lblTag = `multi-lbl-${itemId}`;

							return {
								[imgTag]: bounds({ id: imgTag }),
								[lblTag]: bounds({ id: lblTag }),
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
