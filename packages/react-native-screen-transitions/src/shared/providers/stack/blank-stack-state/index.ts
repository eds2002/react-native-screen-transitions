import { useRef, useSyncExternalStore } from "react";
import type { BlankStackProviderProps } from "../../../types/providers/blank-stack-provider.types";
import type {
	BaseStackDescriptor,
	BaseStackNavigation,
} from "../../../types/stack.types";
import {
	type BlankStackController,
	createBlankStackController,
} from "./blank-stack-controller";

export const useBlankStackState = <
	TDescriptor extends BaseStackDescriptor,
	TNavigation extends BaseStackNavigation,
>(
	props: BlankStackProviderProps<TDescriptor, TNavigation>,
) => {
	const controllerRef = useRef<
		BlankStackController<TDescriptor, TNavigation> | undefined
	>(undefined);

	if (!controllerRef.current) {
		controllerRef.current = createBlankStackController(props);
	}

	const controller = controllerRef.current;
	controller.update(props);

	const snapshot = useSyncExternalStore(
		controller.subscribe,
		controller.getSnapshot,
		controller.getSnapshot,
	);

	return {
		state: snapshot.state,
		handleCloseRoute: controller.handleCloseRoute,
		requestDismiss: controller.requestDismiss,
	};
};
