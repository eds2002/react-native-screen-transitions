import { useDescriptors } from "../../providers/screen/descriptors";
import { AnimationStore } from "../../stores/animation.store";
import { SystemStore } from "../../stores/system.store";
import { useScreenHistory } from "./hooks/history/use-screen-history";
import { useCloseTransitionIntent } from "./hooks/use-close-transition-intent";
import { useOpenTransitionIntent } from "./hooks/use-open-transition-intent";
import { useTransitionStartController } from "./hooks/use-transition-start-controller";

interface Props {
	children: React.ReactNode;
}

/**
 * Unified lifecycle controller for all stack types.
 * Reads current/previous descriptors from DescriptorsProvider context.
 */
export const ScreenLifecycle = ({ children }: Props) => {
	const { current, previous } = useDescriptors();

	const animations = AnimationStore.getBag(current.route.key);
	const system = SystemStore.getBag(current.route.key);

	const { handleManagedCloseEnd, handleNativeCloseEnd } =
		useCloseTransitionIntent(current, animations, system);

	useOpenTransitionIntent(current, animations, system);

	useTransitionStartController({
		current,
		animations,
		system,
		onManagedCloseFinish: handleManagedCloseEnd,
		onNativeCloseFinish: handleNativeCloseEnd,
	});

	useScreenHistory(current, previous, animations);

	return children;
};
