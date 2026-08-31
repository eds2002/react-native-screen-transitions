import type { SmoothClipGroupMotionAnimation } from "react-native-smooth-clip-view";
import type { AnimationConfig } from "../../../../types/animation.types";
import { isSpringAnimationConfig } from "../../../../utils/animation/animate";

const finiteOptional = (value: unknown) =>
	value === undefined || (typeof value === "number" && Number.isFinite(value));

/** Maps only motion configurations SmoothClip can reproduce faithfully. */
export const resolveSmoothClipNativeAnimation = (
	config: AnimationConfig | undefined,
	source: "transition" | "gesture-release",
): SmoothClipGroupMotionAnimation | null => {
	"worklet";
	if (config === undefined) return null;
	if (isSpringAnimationConfig(config)) {
		const candidate = config as AnimationConfig & Record<string, unknown>;
		if (
			candidate.duration !== undefined ||
			candidate.dampingRatio !== undefined ||
			candidate.clamp !== undefined ||
			candidate.overshootClamping === true ||
			!finiteOptional(candidate.mass) ||
			!finiteOptional(candidate.stiffness) ||
			!finiteOptional(candidate.damping)
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
			...(source === "gesture-release"
				? { initialVelocity: "inherit" as const }
				: {}),
		};
	}

	const candidate = config as AnimationConfig & Record<string, unknown>;
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
	};
};
