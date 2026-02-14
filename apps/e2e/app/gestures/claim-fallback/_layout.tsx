import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";

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
					...Transition.Presets.SlideFromBottom(),
					gestureEnabled: true,
					gestureDirection: "vertical",
				}}
			/>
		</BlankStack>
	);
}
