import { useWindowDimensions } from "react-native";
import {
	type SharedValue,
	useAnimatedProps,
	useAnimatedReaction,
	useAnimatedStyle,
	useDerivedValue,
	useSharedValue,
} from "react-native-reanimated";
import { getVisibilityBlockOffset } from "../../../utils/visibility-block-offset";
import {
	hasCloseTransitionFinished,
	hasOpenTransitionStarted,
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
		entering,
		closing,
		pendingLifecycleStartBlockCount,
		pendingLifecycleRequestKind,
	} = motion;

	const hasVisibilityGateOpened = useSharedValue(false);
	const localVisibilityBlocked = useSharedValue(!isFloatingOverlay);
	const lastVisibilityStyle = useSharedValue<{
		opacity: number;
		translateY: number;
		style: { opacity: number; transform: { translateY: number }[] };
	} | null>(null);

	useAnimatedReaction(
		() => {
			"worklet";

			return resolveScreenVisibilityGate({
				isFloatingOverlay,
				hasVisibilityGateOpened: hasVisibilityGateOpened.get(),
				pendingLifecycleStartBlockCount: pendingLifecycleStartBlockCount.get(),
				pendingLifecycleRequestKind: pendingLifecycleRequestKind.get(),
				animationProgress: animationProgress.get(),
				entering: entering.get(),
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

		// The reaction's block reaches styles a frame late. Once the open transition has started, the
		// screen shows in that same frame: the screen under it moves with the same progress, so a lag
		// here showed one frame of nothing over the gap it left.
		const openStarted = hasOpenTransitionStarted({
			pendingLifecycleStartBlockCount: pendingLifecycleStartBlockCount.get(),
			animationProgress: animationProgress.get(),
		});

		return (
			(openStarted || !localVisibilityBlocked.get()) &&
			(ancestorIsScreenReady?.get() ?? true) &&
			resolveScreenReady({
				opening: isPendingOpen || !!entering.get(),
				closing: closing.get(),
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
			closing: closing.get(),
			animationProgress: animationProgress.get(),
		});
		// Only the first unready ancestor applies the offset, including after close.
		// Measurements can therefore use !isScreenReady to correct that one offset.
		const appliesOffset =
			!isScreenReady.get() && (ancestorIsScreenReady?.get() ?? true);

		const opacity = shouldHideClosedScreen ? 0 : 1;
		const translateY = appliesOffset ? offset : 0;

		// Same object while unchanged: Reanimated only skips the native write
		// when the style is shallow-equal, and a fresh transform array is not.
		const previous = lastVisibilityStyle.get();
		if (
			previous &&
			previous.opacity === opacity &&
			previous.translateY === translateY
		) {
			return previous.style;
		}

		const style = { opacity, transform: [{ translateY }] };
		lastVisibilityStyle.set({ opacity, translateY, style });
		return style;
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
