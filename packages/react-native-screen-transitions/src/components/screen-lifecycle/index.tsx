import { useBuilderStore } from "../../providers/screen/builder";
import { useMotionStore } from "../../providers/screen/motion";
import { useScreenHistory } from "./hooks/history/use-screen-history";
import { useCloseCompletion } from "./hooks/use-close-completion";
import { useCloseTransitionIntent } from "./hooks/use-close-transition-intent";
import { useOpenTransitionIntent } from "./hooks/use-open-transition-intent";
import { useTransitionStartController } from "./hooks/use-transition-start-controller";

interface Props {
	children: React.ReactNode;
}

/**
 * Unified lifecycle controller for all stack types.
 * Reads current/previous descriptors from BuilderProvider context.
 */
export const ScreenLifecycle = ({ children }: Props) => {
	const current = useBuilderStore((store) => store.descriptors.current);
	const previous = useBuilderStore((store) => store.descriptors.previous);

	const animations = useMotionStore((store) => store.state);
	const system = animations;

	const { completeClose } = useCloseTransitionIntent(current);

	useOpenTransitionIntent(current, animations, system);

	useTransitionStartController({
		current,
		animations,
		system,
	});

	useCloseCompletion({
		closing: animations.closing,
		animationProgress: system.animationProgress,
		onComplete: completeClose,
	});

	useScreenHistory(current, previous, animations);

	return children;
};
