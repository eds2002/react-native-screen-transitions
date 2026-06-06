import { useRef, useSyncExternalStore } from "react";
import type { ManagedStackProps } from "../../../../types/providers/managed-stack.types";
import type {
	BaseStackDescriptor,
	BaseStackNavigation,
} from "../../../../types/stack.types";
import {
	createManagedStackController,
	type ManagedStackController,
} from "./managed-stack-controller";

export const useManagedStackState = <
	TDescriptor extends BaseStackDescriptor,
	TNavigation extends BaseStackNavigation,
>(
	props: ManagedStackProps<TDescriptor, TNavigation>,
) => {
	const controllerRef = useRef<
		ManagedStackController<TDescriptor, TNavigation> | undefined
	>(undefined);

	if (!controllerRef.current) {
		controllerRef.current = createManagedStackController(props);
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
