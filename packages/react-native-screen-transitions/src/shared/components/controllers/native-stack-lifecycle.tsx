import { useEffect, useLayoutEffect } from "react";
import { useDerivedValue } from "react-native-reanimated";
import type { NativeStackDescriptor } from "../../../native-stack/types";
import { useParentGestureRegistry } from "../../hooks/gestures/use-parent-gesture-registry";
import { useSharedValueState } from "../../hooks/reanimated/use-shared-value-state";
import useStableCallback from "../../hooks/use-stable-callback";
import { useGestureContext } from "../../providers/gestures.provider";
import { useKeys } from "../../providers/keys.provider";
import { AnimationStore } from "../../stores/animation.store";
import { TRUE } from "../../types/state.types";
import { startScreenTransition } from "../../utils/animation/start-screen-transition";
import { resetStoresForScreen } from "../../utils/reset-stores-for-screen";

export interface Props {
	children: React.ReactNode;
}

/**
 * Lifecycle controller built out for Native Stack implementation.
 */
export const NativeStackScreenLifecycleController = ({ children }: Props) => {
	const { current } = useKeys<NativeStackDescriptor>();
	const { parentContext } = useGestureContext();

	const isParentDismissingViaGesture = useSharedValueState(
		useDerivedValue(() => {
			"worklet";
			return parentContext?.gestureAnimationValues.isDismissing?.value ?? false;
		}),
	);

	const animations = AnimationStore.getAll(current.route.key);

	const handleBeforeRemove = useStableCallback((e: any) => {
		const isEnabled = current.options.enableTransitions;

		const isFirstScreen = current.navigation.getState().index === 0;

		// If transitions are disabled, or the dismissal was on the local root, or this is the first screen of the stack, reset the stores
		if (!isEnabled || isParentDismissingViaGesture || isFirstScreen) {
			animations.closing.set(TRUE);
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

	return children;
};
