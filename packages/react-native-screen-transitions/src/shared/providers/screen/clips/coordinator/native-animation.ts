import type { SmoothClipAnimation } from "react-native-smooth-clip-view";
import type { AnimationConfig } from "../../../../types/animation.types";
import { isSpringAnimationConfig } from "../../../../utils/animation/animate";

/** Maps only motion configurations SmoothClip can reproduce faithfully. */
export const resolveSmoothClipNativeAnimation = (
	config: AnimationConfig | undefined,
): SmoothClipAnimation | null => {
	"worklet";
	const finiteOptional = (value: unknown) =>
		value === undefined ||
		(typeof value === "number" && Number.isFinite(value));
	if (config === undefined) return null;
	const candidate = config as AnimationConfig & Record<string, unknown>;
	const reduceMotion =
		candidate.reduceMotion === "system" ||
		candidate.reduceMotion === "always" ||
		candidate.reduceMotion === "never"
			? candidate.reduceMotion
			: undefined;
	if (isSpringAnimationConfig(config)) {
		if (
			candidate.duration !== undefined ||
			candidate.dampingRatio !== undefined ||
			candidate.clamp !== undefined ||
			candidate.overshootClamping !== undefined ||
			candidate.restDisplacementThreshold !== undefined ||
			candidate.restSpeedThreshold !== undefined ||
			!finiteOptional(candidate.mass) ||
			!finiteOptional(candidate.stiffness) ||
			!finiteOptional(candidate.damping) ||
			!finiteOptional(candidate.velocity) ||
			!finiteOptional(candidate.energyThreshold)
		) {
			return null;
		}
		return {
			type: "spring",
			...(typeof candidate.mass === "number" ? { mass: candidate.mass } : {}),
			...(typeof candidate.stiffness === "number"
				? { stiffness: candidate.stiffness }
				: {}),
			...(typeof candidate.damping === "number"
				? { damping: candidate.damping }
				: {}),
			...(typeof candidate.velocity === "number"
				? { velocity: candidate.velocity }
				: {}),
			...(typeof candidate.energyThreshold === "number"
				? { energyThreshold: candidate.energyThreshold }
				: {}),
			...(reduceMotion === undefined ? {} : { reduceMotion }),
		};
	}

	if (
		candidate.easing !== undefined ||
		!finiteOptional(candidate.duration) ||
		(typeof candidate.duration === "number" && candidate.duration < 0)
	) {
		return null;
	}
	return {
		type: "timing",
		duration: typeof candidate.duration === "number" ? candidate.duration : 300,
		controlPoints: [0.25, 0.1, 0.25, 1],
		...(reduceMotion === undefined ? {} : { reduceMotion }),
	};
};
