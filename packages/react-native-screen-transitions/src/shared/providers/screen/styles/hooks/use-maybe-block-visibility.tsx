import { useWindowDimensions } from "react-native";
import {
	useAnimatedProps,
	useAnimatedReaction,
	useAnimatedStyle,
	useSharedValue,
} from "react-native-reanimated";
import { AnimationStore } from "../../../../stores/animation.store";
import { SystemStore } from "../../../../stores/system.store";
import { getVisibilityBlockOffset } from "../../../../utils/visibility-block-offset";
import { useDescriptorDerivations } from "../../descriptors";
import { resolveScreenVisibilityGate } from "../helpers/visibility-gate";

export const useMaybeBlockVisibility = (isFloatingOverlay?: boolean) => {
	const { height } = useWindowDimensions();
	const { currentScreenKey } = useDescriptorDerivations();
	const { entering, transitionProgress } =
		AnimationStore.getBag(currentScreenKey);
	const { pendingLifecycleStartBlockCount, pendingLifecycleRequestKind } =
		SystemStore.getBag(currentScreenKey);

	const hasVisibilityGateOpened = useSharedValue(false);
	const shouldBlockVisibility = useSharedValue(!isFloatingOverlay);

	useAnimatedReaction(
		() => {
			"worklet";

			return resolveScreenVisibilityGate({
				isFloatingOverlay,
				hasVisibilityGateOpened: hasVisibilityGateOpened.get(),
				pendingLifecycleStartBlockCount: pendingLifecycleStartBlockCount.get(),
				pendingLifecycleRequestKind: pendingLifecycleRequestKind.get(),
				progress: transitionProgress.get(),
				entering: entering.get(),
			});
		},
		(gate) => {
			"worklet";

			if (gate.shouldOpenGate) {
				hasVisibilityGateOpened.set(true);
			}

			shouldBlockVisibility.set(gate.shouldBlock);
		},
	);

	const animatedStyle = useAnimatedStyle(() => {
		"worklet";
		const offset = getVisibilityBlockOffset(height);

		return {
			transform: [
				{
					translateY: shouldBlockVisibility.get() ? offset : 0,
				},
			],
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
