// @ts-nocheck
import { interpolate } from "react-native-reanimated";
import Transition from "react-native-screen-transitions";
import { create } from "zustand";
import { useResolvedStackType } from "@/components/stack-examples/stack-routing";
import { BlankStack } from "@/layouts/blank-stack";
import { Stack } from "@/layouts/stack";

export const useStyleIdBoundsStore = create<{ boundTag: string }>(() => ({
	boundTag: "",
}));

export default function StyleIdBoundsLayout() {
	const stackType = useResolvedStackType();
	const StackNavigator = stackType === "native-stack" ? Stack : BlankStack;
	const navigatorScreenOptions =
		stackType === "native-stack" ? { enableTransitions: true } : undefined;
	const boundTag = useStyleIdBoundsStore((s) => s.boundTag);

	return (
		<StackNavigator screenOptions={navigatorScreenOptions}>
			<StackNavigator.Screen name="index" />
			<StackNavigator.Screen
				name="[id]"
				options={{
					gestureEnabled: true,
					gestureDirection: ["vertical"],
					screenStyleInterpolator: ({
						current,
						layouts: { screen },
						bounds,
						progress,
						focused,
						next,
					}) => {
						"worklet";

						const x = interpolate(
							focused ? current.gesture.normX : (next?.gesture.normX ?? 0),
							[-1, 1],
							[-screen.width * 0.5, screen.width * 0.5],
							"clamp",
						);
						const y = interpolate(
							focused ? current.gesture.normY : (next?.gesture.normY ?? 0),
							[-1, 1],
							[-screen.height * 0.5, screen.height * 0.5],
							"clamp",
						);

						if (focused) {
							const focusedBoundStyles = bounds({
								id: boundTag,
								method: "content",
								anchor: "top",
								scaleMode: "uniform",
							});

							const focusMaskStyles = bounds({
								id: boundTag,
								space: "absolute",
								target: "fullscreen",
								method: "size",
							});

							return {
								backdrop: {
									style: {
										backgroundColor: "black",
										opacity: interpolate(progress, [0, 1], [0, 0.75]),
									},
								},
								content: {
									style: {
										transform: [{ translateX: x }, { translateY: y }],
									},
								},
								"container-view": focusedBoundStyles,
								"masked-view": {
									...focusMaskStyles,
									borderRadius: interpolate(progress, [0, 1], [24, 24]),
								},
							};
						}

						const unfocusedBound = bounds({
							id: boundTag,
							gestures: { x, y },
						});

						return {
							content: {
								style: {
									transform: [
										{
											scale: interpolate(progress, [1, 2], [1, 0.9]),
										},
									],
								},
							},
							[boundTag]: unfocusedBound,
						};
					},
					transitionSpec: {
						open: Transition.Specs.FlingSpec,
						close: Transition.Specs.FlingSpec,
					},
				}}
			/>
		</StackNavigator>
	);
}
