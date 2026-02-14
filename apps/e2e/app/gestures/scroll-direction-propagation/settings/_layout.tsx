import { BlankStack } from "@/layouts/blank-stack";

/**
 * Settings layout — the vertical-inverted owner.
 *
 * The transition config (vertical-inverted, slide-from-top) is defined
 * on the parent layout's Stack.Screen for "settings". This layout just
 * registers the screens within the settings stack.
 */
export default function SettingsLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
		</BlankStack>
	);
}
