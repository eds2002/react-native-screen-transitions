import { useBuilderStore } from "../../../../providers/builder";
import { useMotionStore } from "../../../../providers/motion";
import { useCloseCompletion } from "../../../../providers/motion/lifecycle/use-close-completion";
import { useOpenTransitionIntent } from "../../../../providers/motion/lifecycle/use-open-transition-intent";
import { useTransitionStartController } from "../../../../providers/motion/lifecycle/use-transition-start-controller";
import { useScreenHistory } from "./hooks/history/use-screen-history";

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
