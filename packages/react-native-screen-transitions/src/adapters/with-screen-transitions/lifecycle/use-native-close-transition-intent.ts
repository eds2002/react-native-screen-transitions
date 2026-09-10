import { useLayoutEffect, useRef } from "react";
import { resetStoresForScreen } from "../../../components/screen/lifecycle/hooks/helpers/reset-stores-for-screen";
import { useNavigationHelpers } from "../../../hooks/navigation/use-navigation-helpers";
import useStableCallback from "../../../hooks/use-stable-callback";
import type { BaseDescriptor } from "../../../providers/screen/builder";
import { useScreenRelationships } from "../../../providers/screen/builder/topology";
import { useOptionalMotionStore } from "../../../providers/screen/motion";
import {
	dispatchCloseAction,
	isCloseActionReplay,
} from "../../../utils/navigation/close-action-replay";
import type { AdapterDescriptorOptions } from "../options";
import {
	doesNavigatorOwnCloseAction,
	shouldInterceptClose,
} from "./close-interception-rules";

export function useNativeCloseTransitionIntent(current: BaseDescriptor): {
	completeClose: () => void;
} {
	const routeKey = current.route.key;
	const { parentScreenKey } = useScreenRelationships();
	const { dismissScreen, requestDismiss } = useNavigationHelpers();
	const pendingActionRef = useRef<any>(null);

	const nearestAncestorDismissing = useOptionalMotionStore(
		parentScreenKey ?? null,
		(store) => store.state.dismissing,
	);

	const completeClose = useStableCallback(() => {
		const pendingAction = pendingActionRef.current;
		pendingActionRef.current = null;

		if (pendingAction) {
			dispatchCloseAction(pendingAction, (action) => {
				current.navigation.dispatch(action);
			});
		} else {
			dismissScreen();
		}

		resetStoresForScreen(routeKey);
	});

	const handleBeforeRemove = useStableCallback((event: any) => {
		if (isCloseActionReplay(event.data.action)) {
			return;
		}

		const state = current.navigation.getState();
		const routeIndex = state.routes.findIndex(
			(route) => route.key === routeKey,
		);
		const action = event.data.action;
		const ownsAction = doesNavigatorOwnCloseAction({
			state,
			action,
		});
		const shouldIntercept = shouldInterceptClose({
			enabled:
				(current.options as AdapterDescriptorOptions).enableTransitions ===
				true,
			ownsAction,
			ancestorDismissing: !!nearestAncestorDismissing?.get(),
			routeIndex,
			focusedIndex: state.index,
		});

		if (!shouldIntercept) {
			return;
		}

		pendingActionRef.current ??= event.data.action;
		if (!requestDismiss()) {
			pendingActionRef.current = null;
			return;
		}

		event.preventDefault();
	});

	useLayoutEffect(() => {
		return current.navigation.addListener?.("beforeRemove", handleBeforeRemove);
	}, [current.navigation, handleBeforeRemove]);

	return { completeClose };
}
