import { useLayoutEffect } from "react";
import useStableCallback from "../../../../../hooks/use-stable-callback";
import type { BaseDescriptor } from "../../../../../providers/builder";
import { resetStoresForScreen } from "../../../../../providers/motion/lifecycle/reset-stores-for-screen";
import { useNavigationHelpers } from "../../../hooks/use-navigation-helpers";
import { useNavigatorStore } from "../../../state/navigator-store";

export function useCloseTransitionIntent(current: BaseDescriptor) {
	const handleCloseRoute = useNavigatorStore((store) => store.handleCloseRoute);

	const closing = useNavigatorStore(
		(store) => store.scenesByKey[current.route.key]?.activity === "closing",
	);

	const { requestDismiss } = useNavigationHelpers();

	const completeClose = useStableCallback(() => {
		handleCloseRoute?.({ route: current.route });
		resetStoresForScreen(current.route.key);
	});

	useLayoutEffect(() => {
		if (closing) requestDismiss();
	}, [closing, requestDismiss]);

	return { completeClose };
}
