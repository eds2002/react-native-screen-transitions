import { useWindowDimensions } from "react-native";
import {
	type SharedValue,
	useAnimatedProps,
	useAnimatedReaction,
	useAnimatedStyle,
	useDerivedValue,
	useSharedValue,
} from "react-native-reanimated";
import { getVisibilityBlockOffset } from "../../../../utils/visibility-block-offset";
import {
	hasCloseTransitionFinished,
	isScreenReady as resolveScreenReady,
} from "../helpers/transition-visual-state";
import { resolveScreenVisibilityGate } from "../helpers/visibility-gate";
import type { MotionValues } from "../types";
import { LifecycleTransitionRequestKind } from "./use-transition-values";

type Params = {
	motion: MotionValues;
	ancestorIsScreenReady: SharedValue<boolean> | null;
	isFloatingOverlay?: boolean;
};

export const useMaybeBlockVisibility = ({
	motion,
	ancestorIsScreenReady,
	isFloatingOverlay,
}: Params) => {
	const { height } = useWindowDimensions();
	const {
		animationProgress,
		pendingLifecycleStartBlockCount,
		pendingLifecycleRequestKind,
	} = motion;

	const hasVisibilityGateOpened = useSharedValue(false);
	const localVisibilityBlocked = useSharedValue(!isFloatingOverlay);

	useAnimatedReaction(
		() => {
			"worklet";

			return resolveScreenVisibilityGate({
				isFloatingOverlay,
				hasVisibilityGateOpened: hasVisibilityGateOpened.get(),
				pendingLifecycleStartBlockCount: pendingLifecycleStartBlockCount.get(),
				pendingLifecycleRequestKind: pendingLifecycleRequestKind.get(),
				animationProgress: animationProgress.get(),
				entering: motion.entering.get(),
			});
		},
		(gate) => {
			"worklet";

			if (gate.shouldOpenGate) {
				hasVisibilityGateOpened.set(true);
			}

			localVisibilityBlocked.set(gate.shouldBlock);
		},
	);

	const isScreenReady = useDerivedValue(() => {
		"worklet";
		const isPendingOpen =
			pendingLifecycleRequestKind.get() === LifecycleTransitionRequestKind.Open;

		return (
			!localVisibilityBlocked.get() &&
			(ancestorIsScreenReady?.get() ?? true) &&
			resolveScreenReady({
				opening: isPendingOpen || !!motion.entering.get(),
				closing: motion.closing.get(),
				pendingLifecycleStartBlockCount: pendingLifecycleStartBlockCount.get(),
				animationProgress: animationProgress.get(),
			})
		);
	});

	const animatedStyle = useAnimatedStyle(() => {
		"worklet";
		const offset = getVisibilityBlockOffset(height);
		// Hide the outgoing screen after its visual close while React removes its
		// host asynchronously.
		const shouldHideClosedScreen = hasCloseTransitionFinished({
			closing: motion.closing.get(),
			animationProgress: animationProgress.get(),
		});
		// Only the first unready ancestor applies the offset, including after close.
		// Measurements can therefore use !isScreenReady to correct that one offset.
		const appliesOffset =
			!isScreenReady.get() && (ancestorIsScreenReady?.get() ?? true);

		return {
			opacity: shouldHideClosedScreen ? 0 : 1,
			transform: [
				{
					translateY: appliesOffset ? offset : 0,
				},
			],
		};
	});

	const animatedProps = useAnimatedProps(() => {
		"worklet";
		return {
			pointerEvents: isScreenReady.get()
				? ("box-none" as const)
				: ("none" as const),
		};
	});

	return {
		animatedStyle,
		animatedProps,
		isScreenReady,
	};
};
