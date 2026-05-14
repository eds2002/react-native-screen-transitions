import { BlankStack } from "@/layouts/blank-stack";
import {
	verticalInvertedSlideOptions,
	verticalSlidePresentationOptions,
} from "../transition-options";

/**
 * Scroll Direction Propagation Example
 *
 * Structure:
 *   scroll-direction-propagation/  <- gestureDirection: vertical (via parent)
 *     index                         <- Entry point
 *     session                       <- No gesture (inherits vertical from parent)
 *     settings/                     <- gestureDirection: vertical-inverted (slide from top)
 *       index                       <- Transition.ScrollView (coordinates with BOTH owners)
 *
 * This tests the fix where ScrollView ownership is resolved per-direction
 * instead of per-axis. The ScrollView in settings/index must coordinate with:
 *   - The outer stack (vertical) for swipe-down at top boundary
 *   - The settings stack (vertical-inverted) for swipe-up at bottom boundary
 */
export default function ScrollDirectionPropagationLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen
				name="session"
				options={verticalSlidePresentationOptions()}
			/>
			<BlankStack.Screen
				name="settings"
				options={verticalInvertedSlideOptions()}
			/>
		</BlankStack>
	);
}
