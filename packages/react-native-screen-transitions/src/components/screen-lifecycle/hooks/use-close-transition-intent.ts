import { useLayoutEffect, useMemo, useRef } from "react";
import { useNavigationHelpers } from "../../../hooks/navigation/use-navigation-helpers";
import useStableCallback from "../../../hooks/use-stable-callback";
import { hasTransitionsEnabled } from "../../../providers/screen/animation/helpers/has-transitions-enabled";
import type { BaseDescriptor } from "../../../providers/screen/descriptors";
import { useCurrentScreenRelationships } from "../../../providers/screen/use-current-screen-relationships";
import { useBlankStackStore } from "../../../providers/stack/blank-stack.provider";
import { useStackCoreStore } from "../../../providers/stack/core.provider";
import { GestureStore } from "../../../stores/gesture.store";
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
	const { parentScreenKey } = useCurrentScreenRelationships();
	const { dismissScreen, requestDismiss } = useNavigationHelpers();
	const pendingActionRef = useRef<any>(null);

	const nearestAncestorDismissing = useMemo(() => {
		if (!parentScreenKey) return null;

		return GestureStore.peekBag(parentScreenKey)?.dismissing ?? null;
	}, [parentScreenKey]);

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

	// biome-ignore lint/correctness/useExhaustiveDependencies: navigation listener should only rebind when the navigator instance changes
	useLayoutEffect(() => {
		return current.navigation.addListener?.("beforeRemove", handleBeforeRemove);
	}, [current.navigation]);

	return { completeClose };
}
