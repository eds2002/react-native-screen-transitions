import { runOnJS, type SharedValue } from "react-native-reanimated";
import { FALSE, TRUE } from "../../constants";
import type { AnimationStoreMap } from "../../stores/animation.store";
import type { TransitionSpec } from "../../types/animation.types";
import { animate } from "./animate";

interface AnimateToProgressProps {
	/**
	 * Target for the animation:
	 * - "open" = animate to progress 1
	 * - "close" = animate to progress 0
	 * - number = animate to specific progress value (e.g., 0.5 for snap point)
	 */
	target: "open" | "close" | number;
	spec?: TransitionSpec;
	onAnimationFinish?: (finished: boolean) => void;
	animations: AnimationStoreMap;
	targetProgress: SharedValue<number>;
	emitWillAnimate?: boolean;
	markEntering?: boolean;
	/** Optional initial velocity for spring-based progress (units: progress/sec). */
	initialVelocity?: number;
}

export const animateToProgress = ({
	target,
	spec,
	onAnimationFinish,
	animations,
	targetProgress,
	emitWillAnimate = true,
	markEntering = true,
	initialVelocity,
}: AnimateToProgressProps) => {
	"worklet";

	// Determine target value and direction
	const isClosing =
		target === "close" || (typeof target === "number" && target === 0);
	const value = typeof target === "number" ? target : target === "open" ? 1 : 0;

	// Select spec based on direction (closing uses close spec, otherwise open)
	const config = isClosing ? spec?.close : spec?.open;

	const isSpringConfig =
		!!config && !("duration" in config) && !("easing" in config);

	const effectiveConfig =
		isSpringConfig && typeof initialVelocity === "number"
			? { ...config, velocity: initialVelocity }
			: config;

	const { progress, willAnimate, animating, closing, entering } = animations;

	const startAnimation = () => {
		"worklet";
		targetProgress.set(value);

		const shouldClearEnteringOnFinish =
			!isClosing && (markEntering || entering.get());

		if (isClosing) {
			closing.set(TRUE);
			entering.set(FALSE);
		} else if (markEntering) {
			entering.set(TRUE);
		}

		if (!config) {
			animating.set(FALSE);
			progress.set(value);
			if (shouldClearEnteringOnFinish) {
				entering.set(FALSE);
			}

			if (onAnimationFinish) {
				runOnJS(onAnimationFinish)(true);
			}
			return;
		}

		animating.set(TRUE); //<-- Do not move this into the callback
		progress.set(
			animate(value, effectiveConfig, (finished) => {
				"worklet";
				if (!finished) return;

				if (shouldClearEnteringOnFinish) {
					entering.set(FALSE);
				}

				if (onAnimationFinish) {
					runOnJS(onAnimationFinish)(finished);
				}

				// Delay setting animating=FALSE by one frame to ensure final frame is painted
				requestAnimationFrame(() => {
					animating.set(FALSE);
				});
			}),
		);
	};

	if (emitWillAnimate) {
		willAnimate.set(TRUE);
		requestAnimationFrame(() => {
			"worklet";
			willAnimate.set(FALSE);
			startAnimation();
		});
		return;
	}

	startAnimation();
};
