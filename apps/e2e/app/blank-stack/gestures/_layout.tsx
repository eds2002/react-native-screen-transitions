// @ts-nocheck
import { BlankStack } from "@/layouts/blank-stack";
import { GESTURE_SCREEN_OPTIONS } from "./transitions";

export default function GesturesSuiteLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen
				name="horizontal"
				options={GESTURE_SCREEN_OPTIONS.horizontal}
			/>
			<BlankStack.Screen
				name="horizontal-inverted"
				options={GESTURE_SCREEN_OPTIONS["horizontal-inverted"]}
			/>
			<BlankStack.Screen
				name="vertical"
				options={GESTURE_SCREEN_OPTIONS.vertical}
			/>
			<BlankStack.Screen
				name="vertical-inverted"
				options={GESTURE_SCREEN_OPTIONS["vertical-inverted"]}
			/>
			<BlankStack.Screen
				name="bidirectional"
				options={GESTURE_SCREEN_OPTIONS.bidirectional}
			/>
			<BlankStack.Screen
				name="pinch-in"
				options={GESTURE_SCREEN_OPTIONS["pinch-in"]}
			/>
			<BlankStack.Screen
				name="pinch-out"
				options={GESTURE_SCREEN_OPTIONS["pinch-out"]}
			/>
			<BlankStack.Screen
				name="axis-area"
				options={GESTURE_SCREEN_OPTIONS["axis-area"]}
			/>
			<BlankStack.Screen
				name="snap-multi-axis"
				options={GESTURE_SCREEN_OPTIONS["snap-multi-axis"]}
			/>
			<BlankStack.Screen
				name="snap-order-axis"
				options={GESTURE_SCREEN_OPTIONS["snap-order-axis"]}
			/>
			<BlankStack.Screen
				name="snap-pinch-pan"
				options={GESTURE_SCREEN_OPTIONS["snap-pinch-pan"]}
			/>
			<BlankStack.Screen
				name="snap-pinch-only"
				options={GESTURE_SCREEN_OPTIONS["snap-pinch-only"]}
			/>
			<BlankStack.Screen
				name="dynamic-runtime"
				options={GESTURE_SCREEN_OPTIONS["dynamic-runtime"]}
			/>
			<BlankStack.Screen
				name="nested"
				options={GESTURE_SCREEN_OPTIONS.nested}
			/>
		</BlankStack>
	);
}
