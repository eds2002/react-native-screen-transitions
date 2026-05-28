import { useLayoutEffect } from "react";
import useStableCallback from "../../../hooks/use-stable-callback";
import type { BaseDescriptor } from "../../../providers/screen/descriptors";
import { useManagedStackContext } from "../../../providers/stack/managed.provider";
import {
	LifecycleTransitionRequestKind,
	type SystemStoreActions,
	type SystemStoreMap,
} from "../../../stores/system.store";
import { resetStoresForScreen } from "./helpers/reset-stores-for-screen";

interface CloseHookParams {
	current: BaseDescriptor;
	requestLifecycleTransition: SystemStoreActions["requestLifecycleTransition"];
	resetStores: () => void;
}

/**
 * Managed close - reacts to descriptor activity from the managed stack.
 * Used by blank-stack.
 */
const useManagedClose = ({
	current,
	requestLifecycleTransition,
	resetStores,
}: CloseHookParams) => {
	const { handleCloseRoute } = useManagedStackContext();

	useLayoutEffect(() => {
		if (current.activity !== "closing") {
			return;
		}

		requestLifecycleTransition(LifecycleTransitionRequestKind.ManagedClose, 0);
	}, [current.activity, requestLifecycleTransition]);

	const handleManagedCloseEnd = useStableCallback((finished: boolean) => {
		if (!finished) return;
		handleCloseRoute({ route: current.route });
		requestAnimationFrame(() => {
			resetStores();
		});
	});

	return { handleManagedCloseEnd };
};

/**
 * Handles close transition intent and returns finish callbacks for cleanup.
 */
export function useCloseTransitionIntent(
	current: BaseDescriptor,
	system: SystemStoreMap,
): {
	handleManagedCloseEnd?: (finished: boolean) => void;
} {
	const routeKey = current.route.key;
	const { requestLifecycleTransition } = system.actions;

	const resetStores = useStableCallback(() => {
		resetStoresForScreen(routeKey);
	});

	const closeParams: CloseHookParams = {
		current,
		requestLifecycleTransition,
		resetStores,
	};

	return useManagedClose(closeParams);
}
