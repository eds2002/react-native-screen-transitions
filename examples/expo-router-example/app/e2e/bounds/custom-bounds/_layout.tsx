import Transition from "react-native-screen-transitions";
import { Stack } from "@/layouts/stack";

export default function AnchorPointLayout() {
	return (
		<Stack>
			<Stack.Screen name="index" options={{ headerShown: false }} />
			<Stack.Screen
				name="[id]"
				options={{
					enableTransitions: true,
					screenStyleInterpolator: ({
						bounds,
						activeBoundId,
						layouts: { screen },
						focused,
					}) => {
						"worklet";

						const staticBounds = {
							x: focused ? 100 : 0,
							y: 100,
							width: 50,
							height: 100,
							pageX: !focused ? screen.width / 2 : 0,
							pageY: !focused ? screen.height : 0,
						};

						const animation = bounds({
							id: "custom-bounds",
							space: "relative",
							target: staticBounds,
						});

						return {
							[activeBoundId]: animation,
						};
					},
					transitionSpec: {
						open: Transition.specs.DefaultSpec,
						close: Transition.specs.DefaultSpec,
					},
				}}
			/>
		</Stack>
	);
}
