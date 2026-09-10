import { useLayoutEffect } from "react";
import { useNavigationHelpers } from "../../../../hooks/navigation/use-navigation-helpers";
import useStableCallback from "../../../../hooks/use-stable-callback";
import type { BaseDescriptor } from "../../../../providers/screen/builder";
import { useBlankStackStore } from "../../../../providers/stack/blank-stack.provider";
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
