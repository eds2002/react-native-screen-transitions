/** biome-ignore-all lint/correctness/useHookAtTopLevel: <STACK_TYPE is stable per navigator> */
import { useLayoutEffect, useMemo, useRef } from "react";
import { useAnimatedReaction } from "react-native-reanimated";
import useStableCallback from "../../../hooks/use-stable-callback";
import {
	type BaseDescriptor,
	useDescriptorDerivations,
} from "../../../providers/screen/descriptors";
import { useStackCoreContext } from "../../../providers/stack/core.provider";
import { useManagedStackContext } from "../../../providers/stack/managed.provider";
import type { AnimationStoreMap } from "../../../stores/animation.store";
import { GestureStore } from "../../../stores/gesture.store";
import {
	LifecycleTransitionRequestKind,
	type SystemStoreHelpers,
	type SystemStoreMap,
} from "../../../stores/system.store";
import { StackType } from "../../../types/stack.types";
import { resetStoresForScreen } from "./helpers/reset-stores-for-screen";

interface CloseHookParams {
	current: BaseDescriptor;
	animations: AnimationStoreMap;
	requestLifecycleTransition: SystemStoreHelpers["requestLifecycleTransition"];
	resetStores: () => void;
}

/**
 * Managed close - reacts to closingRouteKeysShared from ManagedStackContext.
 * Used by blank-stack and component-stack.
 */
const useManagedClose = ({
	current,
	resetStores,
	requestLifecycleTransition,
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
 * KNOWN BUG:
 * In deeply nested stacks, when removing the outermost stack,
 * whilst it will close, future animations are broken.
 */
const useNativeStackClose = ({
	current,
	animations,
	resetStores,
	requestLifecycleTransition,
}: CloseHookParams) => {
	const { parentScreenKey } = useDescriptorDerivations();
	const pendingActionRef = useRef<any>(null);

	const nearestAncestorDismissing = useMemo(() => {
		if (!parentScreenKey) return null;

		return GestureStore.peekBag(parentScreenKey)?.dismissing ?? null;
	}, [parentScreenKey]);

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

		if (!isEnabled || nearestAncestorDismissing?.get() || isFirstScreen) {
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
) {
	const routeKey = current.route.key;
	const { flags } = useStackCoreContext();
	const { isBranchScreen, branchNavigatorKey } = useDescriptorDerivations();
	const isNativeStack = flags.STACK_TYPE === StackType.NATIVE;
	const { requestLifecycleTransition } = system;

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
		const { handleNativeCloseEnd } = useNativeStackClose(closeParams);
		return { handleNativeCloseEnd };
	} else {
		const { handleManagedCloseEnd } = useManagedClose(closeParams);
		return { handleManagedCloseEnd };
	}
}
