import { BlankStack } from "@/layouts/blank-stack";
import { IOSSlide } from "@/lib/screen-transitions/ios-slide";

/**
 * Visual regression: claim fallback chain.
 *
 * L1 (this stack route) claims vertical.
 * L2 (mid) also claims vertical.
 * L3 (top) claims vertical and shadows L2.
 *
 * After dismissing L3, ownership should fall back to L2 (nearest),
 * not jump to L1.
 */
export default function ClaimFallbackLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen
				name="mid"
				options={{
					...IOSSlide(),
				}}
			/>
		</BlankStack>
	);
}
