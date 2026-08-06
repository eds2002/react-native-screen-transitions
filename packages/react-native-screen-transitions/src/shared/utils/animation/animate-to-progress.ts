import type { SharedValue } from "react-native-reanimated";
import { FALSE, TRUE } from "../../constants";
import {
	type AnimationStoreMap,
	emitMotionStart,
} from "../../stores/animation.store";
import type { TransitionSpec } from "../../types/animation.types";
import { animate, isSpringAnimationConfig } from "./animate";

interface AnimateToProgressProps {
	/**
	 * Target for the animation:
	 * - "open" = animate to progress 1
	 * - "close" = animate to progress 0
	 * - number = animate to specific progress value (e.g., 0.5 for snap point)
	 */
	target: "open" | "close" | number;
	spec?: TransitionSpec;
	animations: AnimationStoreMap;
	targetProgress: SharedValue<number>;
	animationProgress: SharedValue<number>;
	emitWillAnimate?: boolean;
	markEntering?: boolean;
	/** Optional initial velocity for spring-based progress (units: progress/sec). */
	initialVelocity?: number;
	isDragging?: SharedValue<number>;
}

const setTransitionLifecycleFlags = (
	animations: AnimationStoreMap,
	isClosing: boolean,
	markEntering: boolean,
) => {
	"worklet";

	if (isClosing) {
		animations.closing.set(TRUE);
		animations.entering.set(FALSE);
		return;
	}

	animations.closing.set(FALSE);

	if (markEntering) {
		animations.entering.set(TRUE);
	}
};

export const resolveAnimationProgressRange = (
	currentProgress: number,
	targetProgress: number,
) => {
	"worklet";
	return {
		from: Math.min(1, Math.max(0, currentProgress)),
		to: targetProgress,
	};
};

export const animateToProgress = ({
	target,
	spec,
	animations,
	targetProgress,
	animationProgress,
	emitWillAnimate = true,
	markEntering = true,
	initialVelocity,
	isDragging,
}: AnimateToProgressProps) => {
	"worklet";

	// Determine target value and direction
	const isClosing =
		target === "close" || (typeof target === "number" && target === 0);
	const value = typeof target === "number" ? target : target === "open" ? 1 : 0;

	// Select spec based on direction (closing uses close spec, otherwise open)
	const config = isClosing ? spec?.close : spec?.open;

	const isSpringConfig = isSpringAnimationConfig(config);

	const effectiveConfig =
		isSpringConfig && typeof initialVelocity === "number"
			? { ...config, velocity: initialVelocity }
			: config;

	const { transitionProgress, progressAnimating, progressSettled, entering } =
		animations;

	const startAnimation = (activateMotion: boolean) => {
		"worklet";
		const { from: animationProgressFrom, to: animationProgressTo } =
			resolveAnimationProgressRange(transitionProgress.get(), value);

		targetProgress.set(value);
		animationProgress.set(animationProgressFrom);

		const shouldClearEnteringOnFinish =
			!isClosing && (markEntering || entering.get());

		setTransitionLifecycleFlags(animations, isClosing, markEntering);

		if (!config) {
			progressAnimating.set(FALSE);
			progressSettled.set(TRUE);
			transitionProgress.set(value);
			animationProgress.set(animationProgressTo);
			if (shouldClearEnteringOnFinish) {
				entering.set(FALSE);
			}

			return;
		}

		if (activateMotion) {
			progressAnimating.set(TRUE);
		}
		progressSettled.set(FALSE);
		transitionProgress.set(
			animate(
				value,
				effectiveConfig,
				(state) => {
					"worklet";
					if (!state.finished) return;
					if (isDragging?.get()) return;

					progressSettled.set(TRUE);

					animationProgress.set(animationProgressTo);

					if (shouldClearEnteringOnFinish) {
						entering.set(FALSE);
					}

					if (isClosing) {
						progressAnimating.set(FALSE);
					} else {
						// Delay clearing progress animation by one frame to ensure final frame is painted
						requestAnimationFrame(() => {
							progressAnimating.set(FALSE);
						});
					}
				},
				{
					value: animationProgress,
					from: animationProgressFrom,
					to: animationProgressTo,
				},
			),
		);
	};

	if (emitWillAnimate) {
		setTransitionLifecycleFlags(animations, isClosing, markEntering);

		emitMotionStart(animations);
		requestAnimationFrame(() => {
			"worklet";
			startAnimation(false);
		});
		return;
	}

	startAnimation(true);
};
