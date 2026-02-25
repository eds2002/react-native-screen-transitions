import { useEffect, useLayoutEffect } from "react";
import {
	runOnJS,
	useAnimatedReaction,
	useDerivedValue,
} from "react-native-reanimated";
import { useGestureContext } from "../../../providers/gestures.provider";
import {
	type BaseDescriptor,
	useScreenKeys,
} from "../../../providers/screen/keys.provider";
import { useStackCoreContext } from "../../../providers/stack/core.provider";
import { useManagedStackContext } from "../../../providers/stack/managed.provider";
import type { AnimationStoreMap } from "../../../stores/animation.store";
import { HistoryStore } from "../../../stores/history.store";
import { StackType } from "../../../types/stack.types";
import { animateToProgress } from "../../../utils/animation/animate-to-progress";
import { useStack } from "../../navigation/use-stack";
import { useSharedValueState } from "../../reanimated/use-shared-value-state";
import useStableCallback from "../../use-stable-callback";
import {
	registerMountedRoute,
	unregisterMountedRoute,
} from "./helpers/navigator-route-registry";
import { resetStoresForRoute } from "./helpers/reset-stores-for-screen";

interface CloseHookParams {
	current: BaseDescriptor;
	animations: AnimationStoreMap;
	activate: () => void;
	deactivate: () => void;
	isBranchScreen: boolean;
	branchNavigatorKey?: string;
}

/**
 * Managed close - reacts to closingRouteKeysShared from ManagedStackContext.
 * Used by blank-stack and component-stack.
 */
const useManagedClose = ({
	current,
	animations,
	activate,
	deactivate,
	isBranchScreen,
	branchNavigatorKey,
}: CloseHookParams) => {
	const { handleCloseRoute, closingRouteKeysShared } = useManagedStackContext();
	const routeKey = current.route.key;

	const handleCloseEnd = useStableCallback((finished: boolean) => {
		if (!finished) return;
		handleCloseRoute({ route: current.route });
		requestAnimationFrame(() => {
			deactivate();
			resetStoresForRoute(routeKey, isBranchScreen, branchNavigatorKey);
		});
	});

	const transitionSpec = current.options.transitionSpec;

	useAnimatedReaction(
		() => {
			const keys = closingRouteKeysShared.value;
			return keys?.includes(routeKey) ?? false;
		},
		(isClosing, wasClosing) => {
			if (!isClosing || wasClosing) return;

			runOnJS(activate)();
			animateToProgress({
				target: "close",
				spec: transitionSpec,
				animations,
				onAnimationFinish: handleCloseEnd,
			});
		},
	);
};

/**
 * Native stack close - listens to beforeRemove navigation event.
 */
const useNativeStackClose = ({
	current,
	animations,
	activate,
	deactivate,
	isBranchScreen,
	branchNavigatorKey,
}: CloseHookParams) => {
	const gestureCtx = useGestureContext();

	const isAncestorDismissingViaGesture = useSharedValueState(
		useDerivedValue(() => {
			"worklet";
			return (
				gestureCtx?.ancestorContext?.gestureAnimationValues.isDismissing
					?.value ?? false
			);
		}),
	);

	const handleBeforeRemove = useStableCallback((e: any) => {
		const options = current.options as { enableTransitions?: boolean };
		const isEnabled = options.enableTransitions;
		const navigation = current.navigation;
		const routeKey = current.route.key;
		const state = navigation.getState();
		const routeIndex = state.routes.findIndex(
			(route) => route.key === routeKey,
		);
		const isFirstScreen = routeIndex <= 0;

		// If transitions are disabled, ancestor is dismissing, or first screen - let native handle it
		if (!isEnabled || isAncestorDismissingViaGesture || isFirstScreen) {
			animations.closing.set(1);
			resetStoresForRoute(routeKey, isBranchScreen, branchNavigatorKey);
			return;
		}

		e.preventDefault();
		activate();

		animateToProgress({
			target: "close",
			spec: current.options.transitionSpec,
			animations,
			onAnimationFinish: (finished: boolean) => {
				deactivate();
				if (finished) {
					navigation.dispatch(e.data.action);
					requestAnimationFrame(() => {
						resetStoresForRoute(routeKey, isBranchScreen, branchNavigatorKey);
					});
				}
			},
		});
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: Only re-subscribe when navigation changes
	useLayoutEffect(() => {
		return current.navigation.addListener?.("beforeRemove", handleBeforeRemove);
	}, [current.navigation]);
};

/**
 * Unified close handler that branches on stack type.
 */
export function useCloseTransition(
	current: BaseDescriptor,
	animations: AnimationStoreMap,
	activate: () => void,
	deactivate: () => void,
) {
	const routeKey = current.route.key;
	const { navigatorKey } = useStack();
	const { flags } = useStackCoreContext();
	const { isBranchScreen, branchNavigatorKey } = useScreenKeys();
	const isNativeStack = flags.STACK_TYPE === StackType.NATIVE;

	useEffect(() => {
		registerMountedRoute(navigatorKey, routeKey);

		return () => {
			resetStoresForRoute(routeKey, isBranchScreen, branchNavigatorKey);
			const shouldClearNavigator = unregisterMountedRoute(
				navigatorKey,
				routeKey,
			);
			if (shouldClearNavigator) {
				HistoryStore.clearNavigator(navigatorKey);
			}
		};
	}, [navigatorKey, routeKey, isBranchScreen, branchNavigatorKey]);

	const closeParams: CloseHookParams = {
		current,
		animations,
		activate,
		deactivate,
		isBranchScreen,
		branchNavigatorKey,
	};

	if (isNativeStack) {
		// biome-ignore lint/correctness/useHookAtTopLevel: STACK_TYPE is stable per screen instance
		useNativeStackClose(closeParams);
	} else {
		// biome-ignore lint/correctness/useHookAtTopLevel: STACK_TYPE is stable per screen instance
		useManagedClose(closeParams);
	}
}
