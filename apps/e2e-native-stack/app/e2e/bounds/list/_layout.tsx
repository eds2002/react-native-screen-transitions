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

							const id = `${activeBoundId}-icon`;
							const animation = bounds({
								id,
							});

							return {
								[activeBoundId]: animation,
							};
						},
						transitionSpec: {
							open: {
								duration: 1000,
							},
							close: {
								duration: 1000,
							},
						},
					}}
				/>
			</Stack>
			<Footer backIcon="chevron-left" />
		</>
	);
}
