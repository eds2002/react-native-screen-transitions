// @ts-nocheck
import { useResolvedStackType } from "@/components/stack-examples/stack-routing";
import { BlankStack } from "@/layouts/blank-stack";
import { Stack } from "@/layouts/stack";
import { GESTURE_SCREEN_OPTIONS } from "./transitions";

export default function GesturesSuiteLayout() {
	const stackType = useResolvedStackType();
	const StackNavigator = stackType === "native-stack" ? Stack : BlankStack;
	const navigatorScreenOptions =
		stackType === "native-stack" ? { enableTransitions: true } : undefined;

	return (
		<StackNavigator screenOptions={navigatorScreenOptions}>
			<StackNavigator.Screen name="index" />
			<StackNavigator.Screen
				name="horizontal"
				options={GESTURE_SCREEN_OPTIONS.horizontal}
			/>
			<StackNavigator.Screen
				name="horizontal-inverted"
				options={GESTURE_SCREEN_OPTIONS["horizontal-inverted"]}
			/>
			<StackNavigator.Screen
				name="vertical"
				options={GESTURE_SCREEN_OPTIONS.vertical}
			/>
			<StackNavigator.Screen
				name="vertical-inverted"
				options={GESTURE_SCREEN_OPTIONS["vertical-inverted"]}
			/>
			<StackNavigator.Screen
				name="bidirectional"
				options={GESTURE_SCREEN_OPTIONS.bidirectional}
			/>
			<StackNavigator.Screen
				name="pinch-in"
				options={GESTURE_SCREEN_OPTIONS["pinch-in"]}
			/>
			<StackNavigator.Screen
				name="pinch-out"
				options={GESTURE_SCREEN_OPTIONS["pinch-out"]}
			/>
			<StackNavigator.Screen
				name="snap-multi-axis"
				options={GESTURE_SCREEN_OPTIONS["snap-multi-axis"]}
			/>
			<StackNavigator.Screen
				name="snap-order-axis"
				options={GESTURE_SCREEN_OPTIONS["snap-order-axis"]}
			/>
			<StackNavigator.Screen
				name="snap-pinch-pan"
				options={GESTURE_SCREEN_OPTIONS["snap-pinch-pan"]}
			/>
			<StackNavigator.Screen
				name="snap-pinch-only"
				options={GESTURE_SCREEN_OPTIONS["snap-pinch-only"]}
			/>
			<StackNavigator.Screen
				name="dynamic-runtime"
				options={GESTURE_SCREEN_OPTIONS["dynamic-runtime"]}
			/>
		</StackNavigator>
	);
}
