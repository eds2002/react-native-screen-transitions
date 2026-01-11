import { StyleSheet } from "react-native";
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
					snapPoints: [0.1, 0.5, 0.9],
					initialSnapIndex: 0,
					screenStyleInterpolator: ({
						layouts: {
							screen: { height },
						},
						progress,
						current,
						focused,
					}) => {
						"worklet";

						const maxProgress = 0.9;
						const atMax = progress >= maxProgress - 0.01;

						let resistanceOffset = 0;
						if (atMax && current.gesture.y < 0) {
							const overDrag = -current.gesture.y;
							const resistanceFactor = 0.1;
							resistanceOffset = -overDrag * resistanceFactor;
						}

						const scale = interpolate(progress, [1.5, 2], [1, 0.9], "clamp");

						const hMargin = interpolate(
							progress,
							[0.1, 0.15, 0.9],
							[24, 16, 0],
							"clamp",
						);

						const maskBottom = focused
							? interpolate(progress, [0.1, 0.15, 0.9], [24, 16, 0], "clamp")
							: 0;

						const sheetHeight = interpolate(
							progress,
							[0, 0.1, 0.5, 0.9, 1],
							[height * 0.1, height * 0.1, height * 0.5, height * 0.9, height],
							"clamp",
						);

						const maskTop =
							height - sheetHeight - maskBottom + resistanceOffset;

						const slideY = interpolate(
							progress,
							[0, 0.1],
							[sheetHeight + maskBottom + 50, 0],
							"clamp",
						);

						return {
							contentStyle: {
								transform: [{ translateY: slideY }, { scale }],
								borderRadius: interpolate(
									progress,
									[1, 1.5, 1.9],
									[0, 0, 36],
									"clamp",
								),
								overflow: "hidden",
							},
							["CONTENT"]: {
								transform: [{ translateY: maskTop }],
							},
							["MASKED"]: {
								position: "absolute" as const,
								top: maskTop,
								left: hMargin,
								right: hMargin,
								height: sheetHeight,
								borderRadius: 36,
								backgroundColor: "white",
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
