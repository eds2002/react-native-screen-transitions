import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";

export default function GesturesLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			{/* Basic Examples */}
			<BlankStack.Screen
				name="simple-inheritance"
				options={{ ...Transition.Presets.SlideFromBottom() }}
			/>
			<BlankStack.Screen
				name="two-axes"
				options={{ ...Transition.Presets.SlideFromBottom() }}
			/>
			<BlankStack.Screen
				name="same-axis-shadowing"
				options={{ ...Transition.Presets.SlideFromBottom() }}
			/>
			{/* Intermediate Examples */}
			<BlankStack.Screen
				name="deep-nesting"
				options={{ ...Transition.Presets.SlideFromBottom() }}
			/>
			<BlankStack.Screen
				name="inverted-gesture"
				options={{
					gestureEnabled: true,
					gestureDirection: "vertical-inverted",
					screenStyleInterpolator: ({
						layouts: {
							screen: { height },
						},
						progress,
					}) => {
						"worklet";
						const y = interpolate(progress, [0, 1], [-height, 0], "clamp");
						return {
							content: {
								style: {
									transform: [{ translateY: y }],
								},
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
				name="coexistence"
				options={{
					gestureEnabled: true,
					gestureDirection: "vertical-inverted",
					screenStyleInterpolator: ({
						layouts: {
							screen: { height },
						},
						progress,
					}) => {
						"worklet";
						const y = interpolate(progress, [0, 1], [-height, 0], "clamp");
						return {
							content: {
								style: {
									transform: [{ translateY: y }],
								},
							},
						};
					},
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.DefaultSpec,
					},
				}}
			/>
			{/* Snap Point Examples */}
			<BlankStack.Screen
				name="snap-shadows-axis"
				options={{ ...Transition.Presets.SlideFromBottom() }}
			/>
			<BlankStack.Screen
				name="snap-different-axis"
				options={{ ...Transition.Presets.SlideFromBottom() }}
			/>
			<BlankStack.Screen
				name="snap-deep-nesting"
				options={{ ...Transition.Presets.SlideFromBottom() }}
			/>
			<BlankStack.Screen
				name="claim-fallback"
				options={{
					...Transition.Presets.SlideFromBottom(),
					gestureEnabled: true,
					gestureDirection: "vertical",
				}}
			/>
			<BlankStack.Screen
				name="snap-locked-no-bubble"
				options={{
					...Transition.Presets.SlideFromBottom(),
					gestureEnabled: true,
					gestureDirection: "vertical",
				}}
			/>
			{/* ScrollView Examples */}
			<BlankStack.Screen
				name="scroll-direction-propagation"
				options={{ ...Transition.Presets.SlideFromBottom() }}
			/>
			<BlankStack.Screen
				name="scroll-boundary"
				options={{ ...Transition.Presets.SlideFromBottom() }}
			/>
			<BlankStack.Screen
				name="scroll-apple-maps"
				options={{ ...Transition.Presets.SlideFromBottom() }}
			/>
			<BlankStack.Screen
				name="scroll-instagram"
				options={{ ...Transition.Presets.SlideFromBottom() }}
			/>
		</BlankStack>
	);
}
