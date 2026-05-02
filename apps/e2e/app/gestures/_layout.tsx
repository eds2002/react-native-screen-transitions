import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";
import { IOSSlide } from "@/lib/screen-transitions/ios-slide";
import { PINCH_PROBE_OPTIONS } from "./pinch-shadowing/shared";

export default function GesturesLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			{/* Basic Examples */}
			<BlankStack.Screen
				name="simple-inheritance"
				options={{ ...IOSSlide() }}
			/>
			<BlankStack.Screen name="two-axes" options={{ ...IOSSlide() }} />
			<BlankStack.Screen
				name="same-axis-shadowing"
				options={{ ...IOSSlide() }}
			/>
			{/* Intermediate Examples */}
			<BlankStack.Screen name="deep-nesting" options={{ ...IOSSlide() }} />
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
			<BlankStack.Screen name="pinch-shadowing" options={PINCH_PROBE_OPTIONS} />
			{/* Snap Point Examples */}
			<BlankStack.Screen name="snap-shadows-axis" options={{ ...IOSSlide() }} />
			<BlankStack.Screen
				name="snap-different-axis"
				options={{ ...IOSSlide() }}
			/>
			<BlankStack.Screen name="snap-deep-nesting" options={{ ...IOSSlide() }} />
			<BlankStack.Screen
				name="claim-fallback"
				options={{
					...IOSSlide(),
				}}
			/>
			<BlankStack.Screen
				name="snap-locked-no-bubble"
				options={{
					...IOSSlide(),
				}}
			/>
			{/* ScrollView Examples */}
			<BlankStack.Screen
				name="scroll-direction-propagation"
				options={{ ...IOSSlide() }}
			/>
			<BlankStack.Screen
				name="scroll-direction-propagation-horizontal"
				options={{ ...IOSSlide() }}
			/>
			<BlankStack.Screen name="scroll-boundary" options={{ ...IOSSlide() }} />
			<BlankStack.Screen name="scroll-apple-maps" options={{ ...IOSSlide() }} />
			<BlankStack.Screen name="scroll-instagram" options={{ ...IOSSlide() }} />
		</BlankStack>
	);
}
