import useStableCallback from "../../../hooks/use-stable-callback";
import { useBuilderStore } from "../../builder";
import { useMotionStore } from "../motion.store";
import { resetStoresForScreen } from "./reset-stores-for-screen";
import { useCloseCompletion } from "./use-close-completion";
import { useOpenTransitionIntent } from "./use-open-transition-intent";
import { useTransitionStartController } from "./use-transition-start-controller";

/**
 * A screen's motion lifecycle, the same for a navigator's screens and a `Transition.Motion` unit:
 * open on mount (or stay closed), start requested transitions, report when an open settles and when
 * a close finishes. A finished close clears the screen's scroll and bounds records before `onClose`
 * runs, so whatever `onClose` mounts next starts clean.
 */
export function useMotionLifecycle({
	mode = "mount",
	onOpen,
	onClose,
}: {
	mode?: "mount" | "closed";
	onOpen?: () => void;
	onClose?: () => void;
}) {
	const current = useBuilderStore((store) => store.descriptors.current);
	const values = useMotionStore((store) => store.state);
	const handleClose = useStableCallback(() => {
		resetStoresForScreen(current.route.key);
		onClose?.();
	});

	useOpenTransitionIntent(current, values, onOpen, mode);
	useTransitionStartController({ current, values });
	useCloseCompletion({ values, onComplete: handleClose });

	return { current, values };
}
