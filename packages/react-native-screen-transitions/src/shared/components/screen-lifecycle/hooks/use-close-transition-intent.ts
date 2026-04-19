/** biome-ignore-all lint/correctness/useHookAtTopLevel: STACK_TYPE is stable per navigator */
import { useLayoutEffect, useRef } from "react";
import { useAnimatedReaction, useDerivedValue } from "react-native-reanimated";
import { useSharedValueState } from "../../../hooks/reanimated/use-shared-value-state";
import useStableCallback from "../../../hooks/use-stable-callback";
import { useGestureContext } from "../../../providers/gestures";
import {
	type BaseDescriptor,
	useDescriptorDerivations,
} from "../../../providers/screen/descriptors";
import { useStackCoreContext } from "../../../providers/stack/core.provider";
import { useManagedStackContext } from "../../../providers/stack/managed.provider";
import type { AnimationStoreMap } from "../../../stores/animation.store";
import {
	LifecycleTransitionRequestKind,
	type SystemStoreActions,
	type SystemStoreMap,
} from "../../../stores/system.store";
import { StackType } from "../../../types/stack.types";
import { resetStoresForScreen } from "./helpers/reset-stores-for-screen";

interface CloseHookParams {
	current: BaseDescriptor;
	animations: AnimationStoreMap;
	requestLifecycleTransition: SystemStoreActions["requestLifecycleTransition"];
	resetStores: () => void;
}

/**
 * Managed close - reacts to closingRouteKeysShared from ManagedStackContext.
 * Used by blank-stack and component-stack.
 */
const useManagedClose = ({
	current,
	requestLifecycleTransition,
	resetStores,
}: CloseHookParams) => {
	const { handleCloseRoute, closingRouteKeysShared } = useManagedStackContext();
	const routeKey = current.route.key;

	const handleManagedCloseEnd = useStableCallback((finished: boolean) => {
		if (!finished) return;
		handleCloseRoute({ route: current.route });
		requestAnimationFrame(() => {
			resetStores();
		});
	});

	useAnimatedReaction(
		() => {
			const keys = closingRouteKeysShared.value;
			return keys?.includes(routeKey) ?? false;
		},
		(isClosing, wasClosing) => {
			if (!isClosing || wasClosing) return;

			requestLifecycleTransition(
				LifecycleTransitionRequestKind.ManagedClose,
				0,
			);
		},
	);

	return { handleManagedCloseEnd };
};

/**
 * Native stack close - listens to beforeRemove navigation event.
 */
const useNativeStackClose = ({
	current,
	animations,
	requestLifecycleTransition,
	resetStores,
}: CloseHookParams) => {
	const gestureContext = useGestureContext();
	const pendingActionRef = useRef<any>(null);

	const isAncestorDismissingViaGesture = useSharedValueState(
		useDerivedValue(() => {
			"worklet";
			return (
				gestureContext?.ancestorContext?.gestureAnimationValues.dismissing
					?.value ?? false
			);
		}),
	);

	const handleNativeCloseEnd = useStableCallback((finished: boolean) => {
		if (!finished || !pendingActionRef.current) {
			pendingActionRef.current = null;
			return;
		}

		current.navigation.dispatch(pendingActionRef.current);
		pendingActionRef.current = null;
		requestAnimationFrame(() => {
			resetStores();
		});
	});

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

		if (!isEnabled || isAncestorDismissingViaGesture || isFirstScreen) {
			animations.closing.set(1);
			resetStores();
			return;
		}

		e.preventDefault();
		pendingActionRef.current = e.data.action;
		requestLifecycleTransition(LifecycleTransitionRequestKind.NativeClose, 0);
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: navigation listener should only rebind when the navigator instance changes
	useLayoutEffect(() => {
		return current.navigation.addListener?.("beforeRemove", handleBeforeRemove);
	}, [current.navigation]);

	return { handleNativeCloseEnd };
};

/**
 * Handles close transition intent and returns finish callbacks for cleanup.
 */
export function useCloseTransitionIntent(
	current: BaseDescriptor,
	animations: AnimationStoreMap,
	system: SystemStoreMap,
): {
	handleManagedCloseEnd?: (finished: boolean) => void;
	handleNativeCloseEnd?: (finished: boolean) => void;
} {
	const routeKey = current.route.key;
	const { flags } = useStackCoreContext();
	const { isBranchScreen, branchNavigatorKey } = useDescriptorDerivations();
	const isNativeStack = flags.STACK_TYPE === StackType.NATIVE;
	const { requestLifecycleTransition } = system.actions;

	const resetStores = useStableCallback(() => {
		resetStoresForScreen(routeKey, isBranchScreen, branchNavigatorKey);
	});

	const closeParams: CloseHookParams = {
		current,
		animations,
		requestLifecycleTransition,
		resetStores,
	};

	if (isNativeStack) {
		return useNativeStackClose(closeParams);
	}

	return useManagedClose(closeParams);
}
