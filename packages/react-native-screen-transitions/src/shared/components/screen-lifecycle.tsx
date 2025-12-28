import { useIsFocused } from "@react-navigation/native";
import { useLayoutEffect } from "react";
import {
	runOnJS,
	useAnimatedReaction,
	useDerivedValue,
} from "react-native-reanimated";
import { FALSE, TRUE } from "../constants";
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

	useAnimatedReaction(
		() => closingRouteKeysShared.value,
		(keys) => {
			if (!keys?.includes(current.route.key)) return;

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

	// biome-ignore lint/correctness/useExhaustiveDependencies: Only re-subscribe when navigation changes
	useLayoutEffect(() => {
		return current.navigation.addListener?.("beforeRemove", handleBeforeRemove);
	}, [current.navigation]);
};

/**
 * Unified lifecycle controller for all stack types.
 */
export const ScreenLifecycle = ({ children }: Props) => {
	const { flags } = useStackCoreContext();
	const { current } = useKeys();
	const isFocused = useIsFocused();
	const animations = AnimationStore.getAll(current.route.key);
	const { activateHighRefreshRate, deactivateHighRefreshRate } =
		useHighRefreshRate(current);

	const isNativeStack = flags.STACK_TYPE === StackType.NATIVE;

	useAnimatedReaction(
		() => animations.closing.get(),
		(closing) => {
			if (isFocused) {
				animations.entering.set(closing ? FALSE : TRUE);
			}
		},
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: Must only run once on mount
	useLayoutEffect(() => {
		activateHighRefreshRate();
		startScreenTransition({
			target: "open",
			spec: current.options.transitionSpec,
			animations,
			onAnimationFinish: deactivateHighRefreshRate,
		});
	}, []);

	const closeParams: CloseHookParams = {
		current,
		animations,
		activate: activateHighRefreshRate,
		deactivate: deactivateHighRefreshRate,
	};

	if (isNativeStack) {
		// biome-ignore lint/correctness/useHookAtTopLevel: STACK_TYPE is stable per screen instance
		useNativeStackClose(closeParams);
	} else {
		// biome-ignore lint/correctness/useHookAtTopLevel: STACK_TYPE is stable per screen instance
		useManagedClose(closeParams);
	}

	return children;
};
