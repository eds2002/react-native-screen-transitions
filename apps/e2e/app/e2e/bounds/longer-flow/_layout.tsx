import Transition from "react-native-screen-transitions";
import { Footer } from "@/components/footer";
import { Stack } from "@/layouts/stack";

export default function LongerFlowLayout() {
	return (
		<>
			<Stack>
				<Stack.Screen
					name="a"
					options={{
						headerShown: false,
					}}
				/>
				<Stack.Screen
					name="b"
					options={{
						headerShown: false,
						screenStyleInterpolator: ({ bounds }) => {
							"worklet";
							const styles = bounds({
								id: "bound",
								scaleMode: "none",
							});
							return {
								bound: styles,
							};
						},
						enableTransitions: true,
						transitionSpec: {
							open: Transition.Specs.DefaultSpec,
							close: Transition.Specs.DefaultSpec,
						},
					}}
				/>
				<Stack.Screen
					name="c"
					options={{
						headerShown: false,

						screenStyleInterpolator: ({ bounds }) => {
							"worklet";

							const styles = bounds({
								id: "bound",
								scaleMode: "none",
							});
							return {
								bound: styles,
							};
						},
						enableTransitions: true,
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
