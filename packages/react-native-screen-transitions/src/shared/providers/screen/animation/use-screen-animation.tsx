import { useScreenAnimationContext } from "./animation.provider";

export function useScreenAnimation() {
	const { screenAnimation } = useScreenAnimationContext();
	return screenAnimation;
}
