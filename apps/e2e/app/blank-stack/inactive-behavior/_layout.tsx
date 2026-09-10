// @ts-nocheck
import { BlankStack } from "@/layouts/blank-stack";
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

export default function InactiveBehaviorLayout() {
	return (
		<BlankStack>
			<BlankStack.Screen name="index" />
			<BlankStack.Screen name="hide" options={INACTIVE_OPTIONS.hide} />
			<BlankStack.Screen name="pause" options={INACTIVE_OPTIONS.pause} />
			<BlankStack.Screen name="unmount" options={INACTIVE_OPTIONS.unmount} />
			<BlankStack.Screen name="keep" options={INACTIVE_OPTIONS.keep} />
		</BlankStack>
	);
}
