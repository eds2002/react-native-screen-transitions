import { useLayoutEffect } from "react";
import useStableCallback from "../../../../../hooks/use-stable-callback";
import type { BaseDescriptor } from "../../../../../providers/builder";
import { useNavigationHelpers } from "../../../hooks/use-navigation-helpers";
import { useBlankStackStore } from "../../../state/blank-stack.provider";
import { resetStoresForScreen } from "./helpers/reset-stores-for-screen";

export function useCloseTransitionIntent(current: BaseDescriptor) {
	const handleCloseRoute = useBlankStackStore(
		(store) => store.handleCloseRoute,
	);

	const closing = useBlankStackStore(
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
