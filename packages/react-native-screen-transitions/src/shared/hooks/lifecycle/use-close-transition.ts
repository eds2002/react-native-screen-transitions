import { useLayoutEffect } from "react";
import {
	runOnJS,
	useAnimatedReaction,
	useDerivedValue,
} from "react-native-reanimated";
import { useGestureContext } from "../../providers/gestures.provider";
import type { BaseDescriptor } from "../../providers/screen/keys.provider";
import { useStackCoreContext } from "../../providers/stack/core.provider";
import { useManagedStackContext } from "../../providers/stack/managed.provider";
import type { AnimationStoreMap } from "../../stores/animation.store";
import { StackType } from "../../types/stack.types";
import { animateToProgress } from "../../utils/animation/animate-to-progress";
import { resetStoresForScreen } from "../../utils/reset-stores-for-screen";
import { useSharedValueState } from "../reanimated/use-shared-value-state";
import useStableCallback from "../use-stable-callback";

export interface CloseHookParams {
	current: BaseDescriptor;
	animations: AnimationStoreMap;
	activate: () => void;
	deactivate: () => void;
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
}: CloseHookParams) => {
	const { handleCloseRoute, closingRouteKeysShared } = useManagedStackContext();

	const handleCloseEnd = useStableCallback((finished: boolean) => {
		if (!finished) return;
		handleCloseRoute({ route: current.route });
		requestAnimationFrame(() => {
			deactivate();
			resetStoresForScreen(current);
		});
	});

	const routeKey = current.route.key;
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
		const isFirstScreen = navigation.getState().index === 0;

		// If transitions are disabled, ancestor is dismissing, or first screen - let native handle it
		if (!isEnabled || isAncestorDismissingViaGesture || isFirstScreen) {
			animations.closing.set(1);
			resetStoresForScreen(current);
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
						resetStoresForScreen(current);
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
	const { flags } = useStackCoreContext();
	const isNativeStack = flags.STACK_TYPE === StackType.NATIVE;

	const closeParams: CloseHookParams = {
		current,
		animations,
		activate,
		deactivate,
	};

	if (isNativeStack) {
		// biome-ignore lint/correctness/useHookAtTopLevel: STACK_TYPE is stable per screen instance
		useNativeStackClose(closeParams);
	} else {
		// biome-ignore lint/correctness/useHookAtTopLevel: STACK_TYPE is stable per screen instance
		useManagedClose(closeParams);
	}
}
