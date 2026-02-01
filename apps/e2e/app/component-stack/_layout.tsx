import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";

export default function ComponentStackLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen
				name="music-player"
				options={{
					gestureEnabled: true,
					gestureDirection: "vertical",
					screenStyleInterpolator: ({
						progress,
						layouts: {
							screen: { height },
						},
					}) => {
						"worklet";
						const y = interpolate(progress, [0, 1], [height, 0], "clamp");
						return {
							contentStyle: {
								transform: [{ translateY: y }],
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
				name="story-viewer"
				options={{
					gestureEnabled: true,
					gestureDirection: "vertical",
					screenStyleInterpolator: ({
						progress,
						layouts: {
							screen: { height },
						},
					}) => {
						"worklet";
						const y = interpolate(progress, [0, 1], [height, 0], "clamp");
						const scale = interpolate(progress, [1, 2], [1, 0.9], "clamp");
						return {
							contentStyle: {
								transform: [{ translateY: y }, { scale }],
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
				name="onboarding"
				options={{
					gestureEnabled: true,
					gestureDirection: "vertical",
					screenStyleInterpolator: ({
						progress,
						layouts: {
							screen: { height },
						},
					}) => {
						"worklet";
						const y = interpolate(progress, [0, 1], [height, 0], "clamp");
						return {
							contentStyle: {
								transform: [{ translateY: y }],
							},
							backdropStyle: {
								backgroundColor: `rgba(0,0,0,${interpolate(progress, [0, 1], [0, 0.5], "clamp")})`,
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
				name="size-transitions"
				options={{
					gestureEnabled: true,
					gestureDirection: "vertical",
					screenStyleInterpolator: ({
						progress,
						layouts: {
							screen: { height },
						},
					}) => {
						"worklet";
						const y = interpolate(progress, [0, 1], [height, 0], "clamp");
						return {
							contentStyle: {
								transform: [{ translateY: y }],
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
				name="embedded-flow"
				options={{
					gestureEnabled: true,
					gestureDirection: "vertical",
					screenStyleInterpolator: ({
						progress,
						layouts: {
							screen: { height },
						},
					}) => {
						"worklet";
						const y = interpolate(progress, [0, 1], [height, 0], "clamp");
						return {
							contentStyle: {
								transform: [{ translateY: y }],
							},
							backdropStyle: {
								backgroundColor: `rgba(0,0,0,${interpolate(progress, [0, 1], [0, 0.5], "clamp")})`,
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
				name="deep-link/[id]"
				options={{ ...Transition.Presets.SlideFromBottom() }}
			/>
		</BlankStack>
	);
}
