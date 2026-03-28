import {
	useDescriptorDerivations,
	useDescriptors,
} from "../../providers/screen/descriptors";
import { AnimationStore } from "../../stores/animation.store";
import { SystemStore } from "../../stores/system.store";
import { useCloseTransition } from "./hooks/use-close-transition";
import { useOpenTransition } from "./hooks/use-open-transition";
import { useScreenEvents } from "./hooks/use-screen-events";

interface Props {
	children: React.ReactNode;
}

/**
 * Unified lifecycle controller for all stack types.
 * Reads current/previous descriptors from DescriptorsProvider context.
 */
export const ScreenLifecycle = ({ children }: Props) => {
	const { current, previous } = useDescriptors();
	const { isFirstKey } = useDescriptorDerivations();
	const animations = AnimationStore.getBag(current.route.key);
	const { targetProgress } = SystemStore.getBag(current.route.key);

	const { activateHighRefreshRate, deactivateHighRefreshRate } =
		useOpenTransition(current, animations, targetProgress, isFirstKey);

	useCloseTransition(
		current,
		animations,
		targetProgress,
		activateHighRefreshRate,
		deactivateHighRefreshRate,
	);

	useScreenEvents(current, previous, animations);

	return children;
};
