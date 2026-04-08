import { useLayoutEffect, useMemo } from "react";
import {
	runOnJS,
	type SharedValue,
	useAnimatedReaction,
	useDerivedValue,
} from "react-native-reanimated";
import { useStack } from "../../../../hooks/navigation/use-stack";
import { useSharedValueState } from "../../../../hooks/reanimated/use-shared-value-state";
import useStableCallback from "../../../../hooks/use-stable-callback";
import {
	type BaseDescriptor,
	useDescriptorDerivations,
} from "../../../../providers/screen/descriptors";
import { useStackCoreContext } from "../../../../providers/stack/core.provider";
import { useManagedStackContext } from "../../../../providers/stack/managed.provider";
import type { AnimationStoreMap } from "../../../../stores/animation.store";
import { GestureStore } from "../../../../stores/gesture.store";
import { StackType } from "../../../../types/stack.types";
import { animateToProgress } from "../../../../utils/animation/animate-to-progress";
import { resetStoresForScreen } from "./helpers/reset-stores-for-screen";
import { useNavigatorHistoryRegistry } from "./helpers/use-navigator-history-registry";

interface CloseHookParams {
	current: BaseDescriptor;
	animations: AnimationStoreMap;
	targetProgress: SharedValue<number>;
	activate: () => void;
	deactivate: () => void;
	resetStores: () => void;
}

/**
 * Managed close - reacts to closingRouteKeysShared from ManagedStackContext.
 * Used by blank-stack and component-stack.
 */
const useManagedClose = ({
	current,
	animations,
	targetProgress,
	activate,
	deactivate,
	resetStores,
}: CloseHookParams) => {
	const { handleCloseRoute, closingRouteKeysShared } = useManagedStackContext();
	const routeKey = current.route.key;

	const handleCloseEnd = useStableCallback((finished: boolean) => {
		if (!finished) return;
		handleCloseRoute({ route: current.route });
		requestAnimationFrame(() => {
			deactivate();
			resetStores();
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
				targetProgress,
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
	targetProgress,
	activate,
	deactivate,
	resetStores,
}: CloseHookParams) => {
	const { parentScreenKey } = useDescriptorDerivations();

	const nearestAncestorDismissing = useMemo(() => {
		if (!parentScreenKey) return null;

		return GestureStore.peekBag(parentScreenKey)?.dismissing ?? null;
	}, [parentScreenKey]);

	const isAncestorDismissingViaGesture = useSharedValueState(
		useDerivedValue(() => {
			"worklet";
			return nearestAncestorDismissing?.value ?? false;
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

		if (!isEnabled || isAncestorDismissingViaGesture || isFirstScreen) {
			animations.closing.set(1);
			resetStores();
			return;
		}

		e.preventDefault();
		activate();

		animateToProgress({
			target: "close",
			spec: current.options.transitionSpec,
			animations,
			targetProgress,
			onAnimationFinish: (finished: boolean) => {
				deactivate();
				if (finished) {
					navigation.dispatch(e.data.action);
					requestAnimationFrame(() => {
						resetStores();
					});
				}
			},
		});
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
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
	targetProgress: SharedValue<number>,
	activate: () => void,
	deactivate: () => void,
) {
	const routeKey = current.route.key;
	const { navigatorKey } = useStack();
	const { flags } = useStackCoreContext();
	const { isBranchScreen, branchNavigatorKey } = useDescriptorDerivations();
	const isNativeStack = flags.STACK_TYPE === StackType.NATIVE;

	const resetStores = useStableCallback(() => {
		resetStoresForScreen(routeKey, isBranchScreen, branchNavigatorKey);
	});

	const closeParams: CloseHookParams = {
		current,
		animations,
		targetProgress,
		activate,
		deactivate,
		resetStores,
	};

	useNavigatorHistoryRegistry(navigatorKey, routeKey);
	if (isNativeStack) {
		// biome-ignore lint/correctness/useHookAtTopLevel: STACK_TYPE is stable per screen instance
		useNativeStackClose(closeParams);
	} else {
		// biome-ignore lint/correctness/useHookAtTopLevel: STACK_TYPE is stable per screen instance
		useManagedClose(closeParams);
	}
}
