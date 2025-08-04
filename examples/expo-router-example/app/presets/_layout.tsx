import Transition from "react-native-screen-transitions";
import { Stack } from "@/layouts/stack";

export default function PresetsLayout() {
	return (
		<Stack>
			<Stack.Screen
				name="index"
				options={{
					title: "Presets",
					contentStyle: {
						backgroundColor: "white",
					},
					headerShown: false,
				}}
			/>
			<Stack.Screen
				name="slide-from-top"
				options={{
					title: "Slide From Top",
					...Transition.presets.SlideFromTop(),
				}}
			/>
			<Stack.Screen
				name="zoom-in"
				options={{ title: "Zoom In", ...Transition.presets.ZoomIn() }}
			/>
			<Stack.Screen
				name="slide-from-bottom"
				options={{
					title: "Slide From Bottom",
					...Transition.presets.SlideFromBottom(),
				}}
			/>
			<Stack.Screen
				name="draggable-card"
				options={{
					title: "Draggable Card",
					...Transition.presets.DraggableCard(),
				}}
			/>
			<Stack.Screen
				name="elastic-card"
				options={{
					title: "Elastic Card",
					...Transition.presets.ElasticCard(),
				}}
			/>
		</Stack>
	);
}
