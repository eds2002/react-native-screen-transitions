import Transition from "react-native-screen-transitions";
import { Footer } from "@/components/footer";
import { Stack } from "@/layouts/stack";

export default function AnchorPointLayout() {
	return (
		<>
			<Stack>
				<Stack.Screen
					name="index"
					options={{
						headerShown: false,
					}}
				/>
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
								x: 0,
								y: 0,
								width: 100,
								height: 100,
								pageX: screen.width / 2,
								pageY: screen.height * 0.7,
							};

							const animation = bounds({
								id: "custom-bounds",
								space: focused ? "absolute" : "relative",
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
			<Footer backIcon="chevron-left" />
		</>
	);
}
