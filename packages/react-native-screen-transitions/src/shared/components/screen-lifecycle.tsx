import { useEffect, useLayoutEffect } from "react";
import {
	runOnJS,
	useAnimatedReaction,
	useDerivedValue,
} from "react-native-reanimated";
import { useHighRefreshRate } from "../hooks/animation/use-high-refresh-rate";
import { useSharedValueState } from "../hooks/reanimated/use-shared-value-state";
import useStableCallback from "../hooks/use-stable-callback";
import { useGestureContext } from "../providers/gestures.provider";
import {
	type BaseDescriptor,
	useKeys,
} from "../providers/screen/keys.provider";
import { useStackCoreContext } from "../providers/stack/core.provider";
import { useManagedStackContext } from "../providers/stack/managed.provider";
import { AnimationStore } from "../stores/animation.store";
import { StackType } from "../types/stack.types";
import { startScreenTransition } from "../utils/animation/start-screen-transition";
import { resetStoresForScreen } from "../utils/reset-stores-for-screen";

interface Props {
	children: React.ReactNode;
}

interface CloseHookParams {
	enabled: boolean;
	current: BaseDescriptor;
	animations: ReturnType<typeof AnimationStore.getAll>;
	activate: () => void;
	deactivate: () => void;
}

/**
 * Managed close - reacts to closingRouteKeysShared from ManagedStackContext.
 * Used by blank-stack and component-stack.
 */
const useManagedClose = ({
	enabled,
	current,
	animations,
	activate,
	deactivate,
}: CloseHookParams) => {
	// biome-ignore lint/correctness/useHookAtTopLevel: <STACK_TYPE is stable>
	const managedCtx = enabled ? useManagedStackContext() : null;

	const handleCloseEnd = useStableCallback((finished: boolean) => {
		if (!finished) return;
		managedCtx?.handleCloseRoute({ route: current.route });
		requestAnimationFrame(() => {
			deactivate();
			resetStoresForScreen(current);
		});
	});

	useAnimatedReaction(
		() => (enabled ? managedCtx?.closingRouteKeysShared.value : []),
		(keys) => {
			if (!enabled || !keys?.includes(current.route.key)) return;

			runOnJS(activate)();
			startScreenTransition({
				target: "close",
				spec: current.options.transitionSpec,
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
	enabled,
	current,
	animations,
	activate,
	deactivate,
}: CloseHookParams) => {
	const gestureCtx = useGestureContext();

	const isAncestorDismissingViaGesture = useSharedValueState(
		useDerivedValue(() => {
			"worklet";
			if (!enabled) return false;
			return (
				gestureCtx?.ancestorContext?.gestureAnimationValues.isDismissing
					?.value ?? false
			);
		}),
	);

	const handleBeforeRemove = useStableCallback((e: any) => {
		if (!enabled) return;

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

		startScreenTransition({
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

	useEffect(() => {
		if (!enabled) return;

		const navigation = current.navigation;

		return navigation.addListener?.("beforeRemove", handleBeforeRemove);
	}, [enabled, current.navigation, handleBeforeRemove]);
};

/**
 * Unified lifecycle controller for all stack types.
 *
 * Handles:
 * - Open transition on mount (all stacks)
 * - Close transition based on stack type:
 *   - Native stack: listens to beforeRemove event
 *   - Blank/Component stack: reacts to closingRouteKeysShared
 * - High refresh rate activation during transitions
 * - Store cleanup after transitions
 */
export const ScreenLifecycle = ({ children }: Props) => {
	const { flags } = useStackCoreContext();
	const { current } = useKeys();
	const animations = AnimationStore.getAll(current.route.key);
	const { activateHighRefreshRate, deactivateHighRefreshRate } =
		useHighRefreshRate(current);

	const isNativeStack = flags.STACK_TYPE === StackType.NATIVE;

	// ═══════════════════════════════════════════
	// OPEN - identical for all stacks
	// ═══════════════════════════════════════════
	useLayoutEffect(() => {
		activateHighRefreshRate();
		startScreenTransition({
			target: "open",
			spec: current.options.transitionSpec,
			animations,
			onAnimationFinish: deactivateHighRefreshRate,
		});
	}, [animations, current, deactivateHighRefreshRate, activateHighRefreshRate]);

	useManagedClose({
		enabled: !isNativeStack,
		current,
		animations,
		activate: activateHighRefreshRate,
		deactivate: deactivateHighRefreshRate,
	});

	useNativeStackClose({
		enabled: isNativeStack,
		current,
		animations,
		activate: activateHighRefreshRate,
		deactivate: deactivateHighRefreshRate,
	});

	return children;
};
