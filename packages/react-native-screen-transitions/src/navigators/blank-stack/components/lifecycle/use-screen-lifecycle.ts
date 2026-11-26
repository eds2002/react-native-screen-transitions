import { useBuilderStore } from "../../../../providers/builder";
import { useMotionStore } from "../../../../providers/motion";
import { useScreenHistory } from "./hooks/history/use-screen-history";
import { useOpenTransitionIntent } from "./hooks/use-open-transition-intent";
import { useTransitionCompletion } from "./hooks/use-transition-completion";
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

	useOpenTransitionIntent(current, animations, system);

	useTransitionStartController({
		current,
		animations,
		system,
	});

	useTransitionCompletion({
		motion: animations,
		onClose: completeClose,
		onOpen: completeOpen,
	});

	useScreenHistory(current, previous, animations);
}
