// @ts-nocheck
import { useResolvedStackType } from "@/components/stack-examples/stack-routing";
import { BlankStack } from "@/layouts/blank-stack";
import { Stack } from "@/layouts/stack";
import { IOSSlide } from "@/lib/screen-transitions/ios-slide";

const inactiveOptions = (inactiveBehavior) => ({
	...IOSSlide(),
	inactiveBehavior,
});

export default function InactiveBehaviorLayout() {
	const stackType = useResolvedStackType();
	const StackNavigator = stackType === "native-stack" ? Stack : BlankStack;
	const navigatorScreenOptions =
		stackType === "native-stack" ? { enableTransitions: true } : undefined;

	return (
		<StackNavigator screenOptions={navigatorScreenOptions}>
			<StackNavigator.Screen name="index" />
			<StackNavigator.Screen name="keep" options={inactiveOptions("keep")} />
			<StackNavigator.Screen
				name="freeze"
				options={inactiveOptions("freeze")}
			/>
			<StackNavigator.Screen
				name="detach"
				options={inactiveOptions("detach")}
			/>
			<StackNavigator.Screen
				name="unmount"
				options={inactiveOptions("unmount")}
			/>
		</StackNavigator>
	);
}
