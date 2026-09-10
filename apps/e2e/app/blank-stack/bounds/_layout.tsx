import { BlankStack } from "@/layouts/blank-stack";
import { IOSSlide } from "@/lib/screen-transitions/ios-slide";

export default function BoundsLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen name="style-id" options={{ ...IOSSlide() }} />
			<BlankStack.Screen name="zoom" options={{ ...IOSSlide() }} />
			<BlankStack.Screen name="sync" options={{ ...IOSSlide() }} />
			<BlankStack.Screen name="matched-screen" options={{ ...IOSSlide() }} />
			<BlankStack.Screen name="handoff-multiflow" options={{ ...IOSSlide() }} />
			<BlankStack.Screen name="stacking" options={{ ...IOSSlide() }} />
		</BlankStack>
	);
}
