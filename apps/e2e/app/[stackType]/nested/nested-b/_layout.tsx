import { useResolvedStackType } from "@/components/stack-examples/stack-routing";
import { BlankStack } from "@/layouts/blank-stack";
import { Stack } from "@/layouts/stack";
import { horizontalScreenOptions } from "../transitions";

export default function NestedBLayout() {
	const stackType = useResolvedStackType();
	const StackNavigator = stackType === "native-stack" ? Stack : BlankStack;
	const navigatorScreenOptions =
		stackType === "native-stack" ? { enableTransitions: true } : undefined;

	return (
		<StackNavigator
			initialRouteName="a"
			screenOptions={navigatorScreenOptions}
		>
			<StackNavigator.Screen name="a" />
			<StackNavigator.Screen name="b" options={horizontalScreenOptions} />
		</StackNavigator>
	);
}
