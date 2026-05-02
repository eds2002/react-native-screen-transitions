import { BlankStack } from "@/layouts/blank-stack";
import { PINCH_PROBE_OPTIONS, VERTICAL_PROBE_OPTIONS } from "./shared";

export default function PinchShadowingLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen name="inherit" />
			<BlankStack.Screen name="child-pinch" options={PINCH_PROBE_OPTIONS} />
			<BlankStack.Screen
				name="child-vertical"
				options={VERTICAL_PROBE_OPTIONS}
			/>
		</BlankStack>
	);
}
