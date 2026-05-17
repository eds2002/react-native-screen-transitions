import { BlankStack } from "@/layouts/blank-stack";
import { verticalInvertedSlidePresentationOptions } from "../transition-options";

/**
 * Scenario 5: Inverted Gesture
 *
 * Structure:
 *   gestures/inverted-gesture/  <- gestureDirection: vertical-inverted
 *     index                      <- Entry point
 *     leaf                       <- No gesture (inherits inverted)
 *
 * Expected on leaf:
 *   - Swipe ↑ dismisses stack (vertical-inverted = drag UP to dismiss)
 *   - Swipe ↓ does nothing (different direction)
 */
export default function InvertedGestureLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen
				name="leaf"
				options={verticalInvertedSlidePresentationOptions()}
			/>
		</BlankStack>
	);
}
