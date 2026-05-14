import { BlankStack } from "@/layouts/blank-stack";
import { verticalSlideOptions } from "../transition-options";

/**
 * Scenario 6: Same Axis, Different Directions (Coexistence)
 *
 * Structure:
 *   gestures/coexistence/  <- gestureDirection: vertical-inverted (↑ dismisses)
 *     index                <- Entry point
 *     leaf                 <- gestureDirection: vertical (↓ dismisses)
 *
 * Expected on leaf:
 *   - Swipe ↓ dismisses ONLY leaf (vertical from leaf)
 *   - Swipe ↑ dismisses ENTIRE stack (vertical-inverted from parent)
 *   - No conflict! Both directions coexist.
 */
export default function CoexistenceLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen name="leaf" options={verticalSlideOptions()} />
		</BlankStack>
	);
}
