// @ts-nocheck
import { useResolvedStackType } from "@/components/stack-examples/stack-routing";
import { BlankStack } from "@/layouts/blank-stack";
import { Stack } from "@/layouts/stack";
import { IOSSlide } from "@/lib/screen-transitions/ios-slide";

const inactiveOptions = (inactiveBehavior) => ({
	...IOSSlide(),
	inactiveBehavior,
});

const INACTIVE_OPTIONS = {
	hide: inactiveOptions("hide"),
	pause: inactiveOptions("pause"),
	unmount: inactiveOptions("unmount"),
	keep: inactiveOptions("keep"),
};

const NATIVE_SCREEN_OPTIONS = { enableTransitions: true };

export default function InactiveBehaviorLayout() {
	const stackType = useResolvedStackType();
	const StackNavigator = stackType === "native-stack" ? Stack : BlankStack;
	const navigatorScreenOptions =
		stackType === "native-stack" ? NATIVE_SCREEN_OPTIONS : undefined;

	return (
		<StackNavigator screenOptions={navigatorScreenOptions}>
			<StackNavigator.Screen name="index" />
			<StackNavigator.Screen name="hide" options={INACTIVE_OPTIONS.hide} />
			<StackNavigator.Screen name="pause" options={INACTIVE_OPTIONS.pause} />
			<StackNavigator.Screen
				name="unmount"
				options={INACTIVE_OPTIONS.unmount}
			/>
			<StackNavigator.Screen name="keep" options={INACTIVE_OPTIONS.keep} />
		</StackNavigator>
	);
}
