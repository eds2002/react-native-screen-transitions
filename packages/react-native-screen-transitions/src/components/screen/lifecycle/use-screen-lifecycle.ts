import { useBuilderStore } from "../../../providers/screen/builder";
import { useMotionStore } from "../../../providers/screen/motion";
import { useScreenHistory } from "./hooks/history/use-screen-history";
import { useCloseCompletion } from "./hooks/use-close-completion";
import { useOpenTransitionIntent } from "./hooks/use-open-transition-intent";
import { useTransitionStartController } from "./hooks/use-transition-start-controller";

export function useScreenLifecycle({
	completeClose,
	completeOpen,
}: {
	completeClose: () => void;
	completeOpen?: () => void;
}) {
	const current = useBuilderStore((store) => store.descriptors.current);
	const previous = useBuilderStore((store) => store.descriptors.previous);

	const animations = useMotionStore((store) => store.state);
	const system = animations;

	useOpenTransitionIntent(current, animations, system, completeOpen);

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
}
