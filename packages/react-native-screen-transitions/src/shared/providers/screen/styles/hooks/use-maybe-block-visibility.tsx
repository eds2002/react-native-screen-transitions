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

	/**
	 * Visibility has to start blocked before the first animated style pass.
	 *
	 * `useDerivedValue` can publish its computed value after `useAnimatedStyle`
	 * has already read the initial one, which briefly exposes an unhydrated
	 * screen. Keep the visible state in an eagerly initialized shared value, then
	 * let the reaction open it once the visibility gate allows the first
	 * transformed frame to render.
	 */
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
		/**
		 * Keep blocked screens physically offscreen. On physical devices,
		 * opacity: 0 can break Liquid Glass sampling.
		 *
		 * See: https://github.com/expo/expo/issues/41024
		 *
		 */
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
