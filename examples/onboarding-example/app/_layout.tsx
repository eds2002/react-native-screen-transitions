import {
	BlankStack,
	defaultScreenOptions,
} from "@/components/layouts/blank-stack";

export default function RootLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen name="onboarding" options={defaultScreenOptions} />
		</BlankStack>
	);
}
