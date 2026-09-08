import { useRef, useSyncExternalStore } from "react";
import type { BlankStackProviderProps } from "../../../types/providers/blank-stack-provider.types";
import {
	type BlankStackController,
	createBlankStackController,
} from "./blank-stack-controller";

export const useBlankStackState = (props: BlankStackProviderProps) => {
	const controllerRef = useRef<BlankStackController | undefined>(undefined);

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
		handleOpenRoute: controller.handleOpenRoute,
		requestDismiss: controller.requestDismiss,
	};
};
