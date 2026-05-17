// @ts-nocheck
import { BlurView } from "expo-blur";
import { interpolate } from "react-native-reanimated";
import type { SnapPoint } from "react-native-screen-transitions";
import Transition from "react-native-screen-transitions";
import { useResolvedStackType } from "@/components/stack-examples/stack-routing";
import { BlankStack } from "@/layouts/blank-stack";
import { Stack } from "@/layouts/stack";

const sheetOptions = ({
	backdropBehavior,
	customBackdrop,
	snapPoints = [0.5],
	initialSnapIndex = 0,
}: {
	backdropBehavior?: "dismiss" | "block" | "passthrough" | "collapse";
	customBackdrop?: boolean;
	snapPoints?: SnapPoint[];
	initialSnapIndex?: number;
} = {}) => ({
	gestureEnabled: true,
	gestureDirection: "vertical",
	backdropBehavior,
	...(customBackdrop ? { backdropComponent: BlurView } : null),
	snapPoints,
	initialSnapIndex,
	screenStyleInterpolator: ({
		layouts: {
			screen: { height },
		},
		progress,
	}) => {
		"worklet";
		const y = interpolate(progress, [0, 1], [height, 0], "clamp");

		return {
			...(customBackdrop
				? {
						backdrop: {
							props: {
								intensity: interpolate(progress, [0, 1], [0, 75], "clamp"),
							},
						},
					}
				: null),
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
});

export default function BackdropLayout() {
	const stackType = useResolvedStackType();
	const StackNavigator = stackType === "native-stack" ? Stack : BlankStack;
	const navigatorScreenOptions =
		stackType === "native-stack" ? { enableTransitions: true } : undefined;

	return (
		<StackNavigator screenOptions={navigatorScreenOptions}>
			<StackNavigator.Screen name="index" />
			<StackNavigator.Screen
				name="custom"
				options={sheetOptions({
					backdropBehavior: "dismiss",
					customBackdrop: true,
				})}
			/>
			<StackNavigator.Screen
				name="dismiss"
				options={sheetOptions({ backdropBehavior: "dismiss" })}
			/>
			<StackNavigator.Screen
				name="collapse"
				options={sheetOptions({
					backdropBehavior: "collapse",
					snapPoints: [0.5, 0.75],
					initialSnapIndex: 1,
				})}
			/>
			<StackNavigator.Screen
				name="block"
				options={sheetOptions({ backdropBehavior: "block" })}
			/>
			<StackNavigator.Screen
				name="passthrough"
				options={sheetOptions({ backdropBehavior: "passthrough" })}
			/>
		</StackNavigator>
	);
}
