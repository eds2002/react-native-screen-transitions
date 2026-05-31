import { BlankStack } from "@/layouts/blank-stack";
import { verticalSlidePresentationOptions } from "../transition-options";

/**
 * Scenario 1: Simple Inheritance
 *
 * Structure:
 *   gestures/simple-inheritance/  <- This layout defines gestureDirection: vertical
 *     index                       <- Entry point
 *     leaf                        <- No gesture config (inherits from parent)
 *
 * Expected:
 *   - On leaf: Swipe ↓ dismisses entire stack (inherited from parent)
 *   - On leaf: Swipe ↑ → ← does nothing
 */
export default function SimpleInheritanceLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen
				name="leaf"
				options={verticalSlidePresentationOptions()}
			/>
		</BlankStack>
	);
}
