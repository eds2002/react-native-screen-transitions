import { useEffect, useLayoutEffect } from "react";
import { useAnimatedReaction } from "react-native-reanimated";
import type { BlankStackDescriptor } from "../../../blank-stack/types";
import { useStackNavigationContext } from "../../../blank-stack/utils/with-stack-navigation";
import type { NativeStackDescriptor } from "../../../native-stack/types";
import { useParentGestureRegistry } from "../../hooks/gestures/use-parent-gesture-registry";
import { useDerivedValueState } from "../../hooks/use-derived-value-state";
import useStableCallback from "../../hooks/use-stable-callback";
import { useGestureContext } from "../../providers/gestures";
import { useKeys } from "../../providers/keys";
import { AnimationStore } from "../../stores/animation-store";
import { resetStoresForScreen } from "../../stores/utils/reset-stores-for-screen";
import { startScreenTransition } from "../../utils/animation/start-screen-transition";

export interface ScreenLifecycleProps {
	children: React.ReactNode;
}

/**
 * ScreenLifecycleController built out for Native Stack implementation.
 */
export const NativeStackScreenLifecycleController = ({
	children,
}: ScreenLifecycleProps) => {
	const { current } = useKeys<NativeStackDescriptor>();
	const { parentContext } = useGestureContext();

	const isParentDismissingViaGesture = useDerivedValueState(() => {
		"worklet";
		return parentContext?.gestureAnimationValues.isDismissing?.value ?? false;
	});

	const animations = AnimationStore.getAll(current.route.key);

	const handleBeforeRemove = useStableCallback((e: any) => {
		const isEnabled = current.options.enableTransitions;

		const isFirstScreen = current.navigation.getState().index === 0;

		// If transitions are disabled, or the dismissal was on the local root, or this is the first screen of the stack, reset the stores
		if (!isEnabled || isParentDismissingViaGesture || isFirstScreen) {
			resetStoresForScreen(current);
			return;
		}

		e.preventDefault();
		const onAnimationFinish = (finished: boolean) => {
			if (finished) {
				current.navigation.dispatch(e.data.action);

				// we'll ensure the dispatch is complete before resetting stores
				requestAnimationFrame(() => {
					resetStoresForScreen(current);
				});
			}
		};

		startScreenTransition({
			target: "close",
			spec: current.options.transitionSpec,
			onAnimationFinish,
			animations,
		});
	});

	const handleInitialize = useStableCallback(() => {
		startScreenTransition({
			target: "open",
			spec: current.options.transitionSpec,
			animations,
		});
	});

	useEffect(() => {
		const unsubscribe = current.navigation.addListener(
			"beforeRemove",
			handleBeforeRemove,
		);

		return unsubscribe;
	}, [current.navigation, handleBeforeRemove]);

	useLayoutEffect(handleInitialize, []);

	// important for t.a scrollviews inside nested navigators.
	useParentGestureRegistry();

	return children;
};

/**
 * ScreenLifecycleController built out for Blank Stack implementation.
 */

export const BlankStackScreenLifecycleController = ({
	children,
}: ScreenLifecycleProps) => {
	const { current } = useKeys<BlankStackDescriptor>();
	const { handleCloseRoute, closingRouteKeysShared } =
		useStackNavigationContext();

	const animations = AnimationStore.getAll(current.route.key);

	const handleInitialize = useStableCallback(() => {
		startScreenTransition({
			target: "open",
			spec: current.options.transitionSpec,
			animations,
		});
	});

	const handleCleanup = useStableCallback(() => {
		resetStoresForScreen(current);
	});

	const handleCloseEnd = useStableCallback((finished: boolean) => {
		if (!finished) {
			return;
		}
		handleCloseRoute({ route: current.route });
	});

	useAnimatedReaction(
		() => ({
			keys: closingRouteKeysShared.value,
		}),
		({ keys }) => {
			if (!keys.includes(current.route.key)) {
				return;
			}

			startScreenTransition({
				target: "close",
				spec: current.options.transitionSpec,
				animations,
				onAnimationFinish: handleCloseEnd,
			});
		},
	);

	useLayoutEffect(() => {
		handleInitialize();
		return () => {
			handleCleanup();
		};
	}, [handleInitialize, handleCleanup]);

	// important for t.a scrollviews inside nested navigators.
	useParentGestureRegistry();

	return children;
};
