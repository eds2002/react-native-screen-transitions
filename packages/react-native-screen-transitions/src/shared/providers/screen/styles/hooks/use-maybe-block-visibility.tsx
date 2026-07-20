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
	const { closing, entering, progressAnimating, transitionProgress } =
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
		// Keep opacity out of normal rendering so effects such as Liquid Glass
		// retain native compositing. Once closing has fully finished, hiding the
		// outgoing screen lets the handoff settle before React removes its host.
		const shouldHideClosedScreen =
			closing.get() === 1 &&
			transitionProgress.get() <= 0 &&
			progressAnimating.get() === 0;

		if (shouldHideClosedScreen) {
			return {
				opacity: 0,
			};
		}

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
		shouldBlockVisibility,
	};
};
