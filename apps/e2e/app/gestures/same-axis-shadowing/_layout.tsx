import { BlankStack } from "@/layouts/blank-stack";
import {
	verticalSlideOptions,
	verticalSlidePresentationOptions,
} from "../transition-options";

/**
 * Scenario 3: Same Axis Shadowing
 *
 * Structure:
 *   gestures/same-axis-shadowing/  <- This layout defines gestureDirection: vertical
 *     index                        <- Entry point
 *     leaf-a                       <- No gesture (inherits vertical from parent)
 *     leaf-b                       <- gestureDirection: vertical (SHADOWS parent)
 *
 * Expected:
 *   - On leaf-a: Swipe ↓ dismisses ENTIRE stack
 *   - On leaf-b: Swipe ↓ dismisses ONLY leaf-b (shadows parent)
 */
export default function SameAxisShadowingLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen
				name="leaf-a"
				options={verticalSlidePresentationOptions()}
			/>
			<BlankStack.Screen name="leaf-b" options={verticalSlideOptions()} />
		</BlankStack>
	);
}
