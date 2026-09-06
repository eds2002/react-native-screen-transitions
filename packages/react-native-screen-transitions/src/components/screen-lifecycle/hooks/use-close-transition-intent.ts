import { useLayoutEffect, useRef } from "react";
import { useNavigationHelpers } from "../../../hooks/navigation/use-navigation-helpers";
import useStableCallback from "../../../hooks/use-stable-callback";
import type { BaseDescriptor } from "../../../providers/screen/builder";
import { useScreenRelationships } from "../../../providers/screen/builder/topology";
import { useOptionalMotionStore } from "../../../providers/screen/motion";
import { hasTransitionsEnabled } from "../../../providers/screen/motion/animation/helpers/has-transitions-enabled";
import { useBlankStackStore } from "../../../providers/stack/blank-stack.provider";
import { useStackCoreStore } from "../../../providers/stack/core.provider";
import {
	dispatchCloseAction,
	isCloseActionReplay,
} from "../../../utils/navigation/close-action-replay";
import {
	doesNavigatorOwnCloseAction,
	shouldInterceptClose,
} from "./helpers/close-interception-rules";
import { resetStoresForScreen } from "./helpers/reset-stores-for-screen";

export function useCloseTransitionIntent(current: BaseDescriptor): {
	completeClose: () => void;
} {
	const routeKey = current.route.key;
	const transitionsAlwaysOn = useStackCoreStore(
		(store) => store.flags.TRANSITIONS_ALWAYS_ON,
	);
	const handleCloseRoute = useBlankStackStore(
		(store) => store.handleCloseRoute,
	);
	const isBlankStackClosing = useBlankStackStore(
		(store) => store.scenesByKey[routeKey]?.activity === "closing",
	);
	const { parentScreenKey } = useScreenRelationships();
	const { dismissScreen, requestDismiss } = useNavigationHelpers();
	const pendingActionRef = useRef<any>(null);

	const nearestAncestorDismissing = useOptionalMotionStore(
		parentScreenKey ?? null,
		(store) => store.state.dismissing,
	);

	useLayoutEffect(() => {
		if (isBlankStackClosing) {
			requestDismiss();
		}
	}, [isBlankStackClosing, requestDismiss]);

	const completeClose = useStableCallback(() => {
		const pendingAction = pendingActionRef.current;
		pendingActionRef.current = null;

		if (pendingAction) {
			dispatchCloseAction(pendingAction, (action) => {
				current.navigation.dispatch(action);
			});
		} else if (handleCloseRoute) {
			handleCloseRoute({ route: current.route });
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
			enabled: hasTransitionsEnabled(current.options, transitionsAlwaysOn),
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
		if (handleCloseRoute) {
			return;
		}

		return current.navigation.addListener?.("beforeRemove", handleBeforeRemove);
	}, [current.navigation, handleBeforeRemove, handleCloseRoute]);

	return { completeClose };
}
