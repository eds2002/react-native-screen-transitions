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
					...Transition.Presets.SlideFromTop(),
				}}
			/>
			<Stack.Screen
				name="zoom-in"
				options={{ title: "Zoom In", ...Transition.Presets.ZoomIn() }}
			/>
			<Stack.Screen
				name="slide-from-bottom"
				options={{
					title: "Slide From Bottom",
					...Transition.Presets.SlideFromBottom(),
				}}
			/>
			<Stack.Screen
				name="draggable-card"
				options={{
					title: "Draggable Card",
					...Transition.Presets.DraggableCard(),
				}}
			/>
			<Stack.Screen
				name="elastic-card"
				options={{
					title: "Elastic Card",
					...Transition.Presets.ElasticCard(),
				}}
			/>
		</Stack>
	);
}
