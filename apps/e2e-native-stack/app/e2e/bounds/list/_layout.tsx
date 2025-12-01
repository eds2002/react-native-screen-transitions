import Transition from "react-native-screen-transitions";
import { Footer } from "@/components/footer";
import { Stack } from "@/layouts/stack";

export default function ListLayout() {
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
						screenStyleInterpolator: ({ bounds, activeBoundId }) => {
							"worklet";

							const id = `${activeBoundId}`;
							const animation = bounds({
								id,
							});
							return {
								[id]: animation,
							};
						},
						transitionSpec: {
							open: Transition.Specs.DefaultSpec,
							close: Transition.Specs.DefaultSpec,
						},
					}}
				/>
			</Stack>
			<Footer backIcon="chevron-left" />
		</>
	);
}
