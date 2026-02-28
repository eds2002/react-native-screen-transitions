import { useKeys, useScreenKeys } from "../../providers/screen/keys";
import { AnimationStore } from "../../stores/animation.store";
import { useCloseTransition } from "./hooks/use-close-transition";
import { useOpenTransition } from "./hooks/use-open-transition";
import { useScreenEvents } from "./hooks/use-screen-events";

interface Props {
	children: React.ReactNode;
}

/**
 * Unified lifecycle controller for all stack types.
 * Reads current/previous descriptors from KeysProvider context.
 */
export const ScreenLifecycle = ({ children }: Props) => {
	const { current, previous } = useKeys();
	const { isFirstKey } = useScreenKeys();
	const animations = AnimationStore.getAll(current.route.key);

	const { activateHighRefreshRate, deactivateHighRefreshRate } =
		useOpenTransition(current, animations, isFirstKey);

	useCloseTransition(
		current,
		animations,
		activateHighRefreshRate,
		deactivateHighRefreshRate,
	);

	useScreenEvents(current, previous, animations);

	return children;
};
