// @ts-nocheck
import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { useResolvedStackType } from "@/components/stack-examples/stack-routing";
import { BlankStack } from "@/layouts/blank-stack";
import { Stack } from "@/layouts/stack";

export default function BlankStackLayout() {
	const stackType = useResolvedStackType();
	const StackNavigator = stackType === "native-stack" ? Stack : BlankStack;
	const navigatorScreenOptions =
		stackType === "native-stack" ? { enableTransitions: true } : undefined;
	return (
		<StackNavigator screenOptions={navigatorScreenOptions}>
			<StackNavigator.Screen name="index" />
			<StackNavigator.Screen
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
			<StackNavigator.Screen
				name="slide-vertical"
				options={{
					gestureEnabled: true,
					gestureDirection: "vertical",
					...Transition.Presets.SlideFromBottom(),
				}}
			/>
			<StackNavigator.Screen
				name="draggable-card"
				options={{
					gestureEnabled: true,
					...Transition.Presets.DraggableCard(),
				}}
			/>
			<StackNavigator.Screen
				name="elastic-card"
				options={{
					gestureEnabled: true,
					...Transition.Presets.ElasticCard(),
				}}
			/>
			<StackNavigator.Screen
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
			<StackNavigator.Screen
				name="stack-progress"
				options={{ ...Transition.Presets.SlideFromBottom() }}
			/>
			<StackNavigator.Screen
				name="overlay"
				options={{ ...Transition.Presets.SlideFromBottom() }}
			/>
			<StackNavigator.Screen
				name="bottom-sheet"
				options={{ ...Transition.Presets.SlideFromBottom() }}
			/>
			<StackNavigator.Screen
				name="scroll-tests"
				options={{ ...Transition.Presets.SlideFromBottom() }}
			/>
			<StackNavigator.Screen
				name="deep-link/[id]"
				options={{ ...Transition.Presets.SlideFromBottom() }}
			/>
			<StackNavigator.Screen
				name="touch-gating"
				options={{ ...Transition.Presets.SlideFromBottom() }}
			/>
			<StackNavigator.Screen
				name="bounds"
				options={{ ...Transition.Presets.SlideFromBottom() }}
			/>
		</StackNavigator>
	);
}
