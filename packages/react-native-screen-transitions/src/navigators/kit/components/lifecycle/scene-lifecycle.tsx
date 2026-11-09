import { useBuilderStore } from "../../../../providers/builder";
import { useMotionLifecycle } from "../../../../providers/motion/lifecycle/use-motion-lifecycle";
import { useNavigatorStore } from "../../state/navigator-store";
import { useScreenHistory } from "./hooks/history/use-screen-history";
import { useCloseTransitionIntent } from "./hooks/use-close-transition-intent";

export function SceneLifecycle() {
	const current = useBuilderStore((store) => store.descriptors.current);
	const previous = useBuilderStore((store) => store.descriptors.previous);
	const handleOpenRoute = useNavigatorStore((store) => store.handleOpenRoute);
	const { completeClose } = useCloseTransitionIntent(current);

	const { values } = useMotionLifecycle({
		onOpen: () => handleOpenRoute?.({ route: current.route }),
		onClose: completeClose,
	});
	useScreenHistory(current, previous, values);

	return null;
}
