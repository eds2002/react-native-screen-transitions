/** biome-ignore-all lint/style/noNonNullAssertion: <Lifecycles are rendered right under the gesture provider> */
import { useEffect, useLayoutEffect } from "react";
import { useDerivedValue } from "react-native-reanimated";
import { useHighRefreshRate } from "../../shared/hooks/animation/use-high-refresh-rate";
import { useSharedValueState } from "../../shared/hooks/reanimated/use-shared-value-state";
import useStableCallback from "../../shared/hooks/use-stable-callback";
import { useGestureContext } from "../../shared/providers/gestures.provider";
import { useKeys } from "../../shared/providers/screen/keys.provider";
import { AnimationStore } from "../../shared/stores/animation.store";
import { TRUE } from "../../shared/types/state.types";
import { startScreenTransition } from "../../shared/utils/animation/start-screen-transition";
import { resetStoresForScreen } from "../../shared/utils/reset-stores-for-screen";
import type { NativeStackDescriptor } from "../types";

export interface Props {
	children: React.ReactNode;
}

/**
 * Lifecycle controller built out for Native Stack implementation.
 */
export const NativeStackScreenLifecycleController = ({ children }: Props) => {
	const { current } = useKeys<NativeStackDescriptor>();
	const { ancestorContext } = useGestureContext()!;

	const isAncestorDismissingViaGesture = useSharedValueState(
		useDerivedValue(() => {
			"worklet";
			return (
				ancestorContext?.gestureAnimationValues.isDismissing?.value ?? false
			);
		}),
	);

	const animations = AnimationStore.getAll(current.route.key);

	const { deactivateHighRefreshRate, activateHighRefreshRate } =
		useHighRefreshRate(current);

	const handleBeforeRemove = useStableCallback((e: any) => {
		const isEnabled = current.options.enableTransitions;

		const isFirstScreen = current.navigation.getState().index === 0;

		// If transitions are disabled, or an ancestor is dismissing via gesture, or this is the first screen of the stack, reset the stores
		if (!isEnabled || isAncestorDismissingViaGesture || isFirstScreen) {
			animations.closing.set(TRUE);
			resetStoresForScreen(current);
			return;
		}

		e.preventDefault();
		activateHighRefreshRate();
		const onAnimationFinish = (finished: boolean) => {
			deactivateHighRefreshRate();
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
		activateHighRefreshRate();
		startScreenTransition({
			target: "open",
			spec: current.options.transitionSpec,
			animations,
			onAnimationFinish: deactivateHighRefreshRate,
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
