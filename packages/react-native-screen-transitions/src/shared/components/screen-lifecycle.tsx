import { useCloseTransition } from "../hooks/lifecycle/use-close-transition";
import { useOpenTransition } from "../hooks/lifecycle/use-open-transition";
import { useScreenEvents } from "../hooks/lifecycle/use-screen-events";
import type { BaseDescriptor } from "../providers/screen/keys.provider";
import { AnimationStore } from "../stores/animation.store";

interface Props {
	children: React.ReactNode;
	current: BaseDescriptor;
	previous?: BaseDescriptor;
}

/**
 * Unified lifecycle controller for all stack types.
 */
export const ScreenLifecycle = ({ children, current, previous }: Props) => {
	const animations = AnimationStore.getAll(current.route.key);

	const { activateHighRefreshRate, deactivateHighRefreshRate } =
		useOpenTransition(current, animations);

	useCloseTransition(
		current,
		animations,
		activateHighRefreshRate,
		deactivateHighRefreshRate,
	);

	useScreenEvents(current, previous, animations);

	return children;
};
