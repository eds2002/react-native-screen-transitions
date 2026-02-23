import { useScreenAnimationContext } from "../../../providers/screen/animation.provider";

export function useScreenAnimation() {
	const { screenAnimation } = useScreenAnimationContext();
	return screenAnimation;
}
