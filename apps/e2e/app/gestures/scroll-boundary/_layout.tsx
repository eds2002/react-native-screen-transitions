import { BlankStack } from "@/layouts/blank-stack";
import { verticalSlideOptions } from "../transition-options";

/**
 * ScrollView Boundary Example
 *
 * Demonstrates that a vertical ScrollView must be at scrollY = 0
 * before it yields to the vertical dismiss gesture.
 */
export default function ScrollBoundaryLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen name="screen" options={verticalSlideOptions()} />
		</BlankStack>
	);
}
