import { BlankStack } from "@/layouts/blank-stack";
import { IOSSlide } from "@/lib/screen-transitions/ios-slide";

/**
 * L2 stack in claim-fallback scenario.
 *
 * L2 claims vertical. L3 (top) also claims vertical and shadows L2 while mounted.
 */
export default function ClaimFallbackMidLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen
				name="top"
				options={{
					...IOSSlide(),
				}}
			/>
		</BlankStack>
	);
}
