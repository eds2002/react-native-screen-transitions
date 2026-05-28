// @ts-nocheck
import { BlankStack } from "@/layouts/blank-stack";

export default function NestedGestureLayout() {
	const StackNavigator = BlankStack;

	return (
		<StackNavigator>
			<StackNavigator.Screen name="index" />
		</StackNavigator>
	);
}
