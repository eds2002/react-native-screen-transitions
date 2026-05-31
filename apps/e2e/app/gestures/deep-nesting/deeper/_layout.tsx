import { BlankStack } from "@/layouts/blank-stack";
import { verticalSlideOptions } from "../../transition-options";

/**
 * Level 2: Horizontal nested stack inside deep-nesting (vertical)
 *
 * This stack has horizontal gesture direction.
 * The leaf inside will have vertical gesture (shadowing level 1).
 */
export default function DeeperLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen name="leaf" options={verticalSlideOptions()} />
		</BlankStack>
	);
}
