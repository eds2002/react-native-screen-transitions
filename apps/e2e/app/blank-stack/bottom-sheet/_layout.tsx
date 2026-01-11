import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";

export default function BottomSheetLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen
				name="from-bottom"
				options={{
					gestureEnabled: true,
					gestureDirection: "vertical",
					snapPoints: [0.5, 1.0],
					initialSnapIndex: 0,
					screenStyleInterpolator: ({
						layouts: {
							screen: { height },
						},
						progress,
					}) => {
						"worklet";
						const y = interpolate(progress, [0, 1], [height, 0], "clamp");
						const scale = interpolate(progress, [1.5, 2], [1, 0.95], "clamp");

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
				name="from-top"
				options={{
					gestureEnabled: true,
					gestureDirection: "vertical-inverted",
					snapPoints: [0.5, 1.0],
					initialSnapIndex: 0,
					screenStyleInterpolator: ({
						layouts: {
							screen: { height },
						},
						progress,
					}) => {
						"worklet";
						const y = interpolate(progress, [0, 1], [-height, 0], "clamp");
						const scale = interpolate(progress, [1.5, 2], [1, 0.95], "clamp");

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
				name="with-resistance"
				options={{
					gestureEnabled: true,
					gestureDirection: "vertical",
					snapPoints: [0.5, 0.9],
					initialSnapIndex: 0,
					screenStyleInterpolator: ({
						layouts: {
							screen: { height },
						},
						progress,
						current,
						insets,
						focused,
					}) => {
						"worklet";

						// Base position from progress (0.5 = halfway up the screen)
						const baseY = interpolate(progress, [0, 1], [height, 0], "clamp");

						// Resistance when over-extending past max snap point (0.5)
						// gesture.y is negative when dragging up, animates back to 0 on release
						const maxProgress = 0.9;
						const atMax = progress >= maxProgress - 0.01;

						let resistanceOffset = 0;
						if (atMax && current.gesture.y < 0) {
							// Apply rubber-band resistance (diminishing returns)
							const overDrag = -current.gesture.y;
							const resistanceFactor = 0.1;
							resistanceOffset = -overDrag * resistanceFactor;
						}

						const scale = interpolate(progress, [1.5, 2], [1, 0.95], "clamp");
						const margin = focused
							? interpolate(progress, [0.5, 0.9], [insets.bottom, 0], "clamp")
							: 0;

						return {
							contentStyle: {
								transform: [
									{ translateY: baseY + resistanceOffset },
									{ scale },
								],
								margin,
							},
						};
					},
					transitionSpec: {
						open: Transition.Specs.DefaultSpec,
						close: Transition.Specs.DefaultSpec,
					},
				}}
			/>
		</BlankStack>
	);
}
