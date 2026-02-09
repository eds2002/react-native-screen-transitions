import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";

export default function BlankStackLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen
				name="slide-horizontal"
				options={{
					gestureEnabled: true,
					gestureDirection: "horizontal",
					experimental_enableHighRefreshRate: true,
					screenStyleInterpolator: ({
						progress,
						layouts: {
							screen: { width },
						},
					}) => {
						"worklet";
						const translateX = interpolate(
							progress,
							[0, 1, 2],
							[width, 0, -width * 0.3],
						);
						return {
							contentStyle: {
								transform: [{ translateX }],
							},
						};
					},
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.DefaultSpec,
					},
				}}
			/>
			<BlankStack.Screen
				name="slide-vertical"
				options={{
					gestureEnabled: true,
					gestureDirection: "vertical",

					...Transition.Presets.SlideFromBottom(),
				}}
			/>
			<BlankStack.Screen
				name="draggable-card"
				options={{
					gestureEnabled: true,
					...Transition.Presets.DraggableCard(),
				}}
			/>
			<BlankStack.Screen
				name="elastic-card"
				options={{
					gestureEnabled: true,
					...Transition.Presets.ElasticCard(),
				}}
			/>
			<BlankStack.Screen
				name="detail"
				options={{
					gestureEnabled: true,
					gestureDirection: "horizontal",
					screenStyleInterpolator: ({
						progress,
						layouts: {
							screen: { width },
						},
					}) => {
						"worklet";
						const translateX = interpolate(
							progress,
							[0, 1, 2],
							[width, 0, -width * 0.3],
						);
						return {
							contentStyle: {
								transform: [{ translateX }],
							},
						};
					},
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.DefaultSpec,
					},
				}}
			/>
			<BlankStack.Screen
				name="stack-progress"
				options={{ ...Transition.Presets.SlideFromBottom() }}
			/>
			<BlankStack.Screen
				name="overlay"
				options={{ ...Transition.Presets.SlideFromBottom() }}
			/>
			<BlankStack.Screen
				name="bottom-sheet"
				options={{ ...Transition.Presets.SlideFromBottom() }}
			/>
			<BlankStack.Screen
				name="scroll-tests"
				options={{ ...Transition.Presets.SlideFromBottom() }}
			/>
			<BlankStack.Screen
				name="deep-link/[id]"
				options={{ ...Transition.Presets.SlideFromBottom() }}
			/>
			<BlankStack.Screen
				name="touch-gating"
				options={{ ...Transition.Presets.SlideFromBottom() }}
			/>
			<BlankStack.Screen
				name="active-bounds"
				options={{ ...Transition.Presets.SlideFromBottom() }}
			/>
			<BlankStack.Screen
				name="gesture-bounds"
				options={{ ...Transition.Presets.SlideFromBottom() }}
			/>
			<BlankStack.Screen
				name="style-id-bounds"
				options={{ ...Transition.Presets.SlideFromBottom() }}
			/>
		</BlankStack>
	);
}
