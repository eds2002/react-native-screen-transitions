import { useBuilderStore } from "../../../../providers/builder";
import { useNavigatorStore } from "../../state/navigator-store";
import { useCloseTransitionIntent } from "./hooks/use-close-transition-intent";
import { useScreenLifecycle } from "./use-screen-lifecycle";

export function SceneLifecycle() {
	const current = useBuilderStore((store) => store.descriptors.current);
	const handleOpenRoute = useNavigatorStore((store) => store.handleOpenRoute);

	const { completeClose } = useCloseTransitionIntent(current);

	useScreenLifecycle({
		completeClose,
		completeOpen: () => handleOpenRoute?.({ route: current.route }),
	});

	return null;
}
