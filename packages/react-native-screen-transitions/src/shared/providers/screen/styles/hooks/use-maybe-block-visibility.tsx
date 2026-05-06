import {
	useAnimatedProps,
	useAnimatedStyle,
	useDerivedValue,
} from "react-native-reanimated";
import { AnimationStore } from "../../../../stores/animation.store";
import { SystemStore } from "../../../../stores/system.store";
import { useDescriptorDerivations } from "../../descriptors";

export const useMaybeBlockVisibility = (isFloatingOverlay?: boolean) => {
	const { currentScreenKey } = useDescriptorDerivations();
	const progress = AnimationStore.getValue(currentScreenKey, "progress");

	const { pendingLifecycleStartBlockCount } =
		SystemStore.getBag(currentScreenKey);

	const shouldBlockVisibility = useDerivedValue(() => {
		"worklet";

		if (isFloatingOverlay) {
			return false;
		}

		const hasPendingLifecycleBlock = pendingLifecycleStartBlockCount.get() > 0;

		// Hide the screen during the tiny pre-animation open window as well.
		// The destination measurement blocker can be registered one frame after
		// mount, which would otherwise flash the reset state before the block
		// count turns visible to this provider.
		const isWaitingForOpenToStart = progress.get() <= 0;

		return hasPendingLifecycleBlock || isWaitingForOpenToStart;
	});

	const animatedStyle = useAnimatedStyle(() => {
		"worklet";

		return {
			opacity: shouldBlockVisibility.get() ? 0 : 1,
		};
	});

	const animatedProps = useAnimatedProps(() => {
		"worklet";
		return {
			pointerEvents: shouldBlockVisibility.get()
				? ("none" as const)
				: ("box-none" as const),
		};
	});

	return {
		animatedStyle,
		animatedProps,
	};
};
