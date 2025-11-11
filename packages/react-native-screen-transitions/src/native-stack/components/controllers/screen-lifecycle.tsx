import { useEffect, useLayoutEffect } from "react";
import { useParentGestureRegistry } from "../../hooks/gestures/use-parent-gesture-registry";
import useStableCallback from "../../hooks/use-stable-callback";
import { useKeys } from "../../providers/keys";
import { Animations } from "../../stores/animations";
import { NavigatorDismissState } from "../../stores/navigator-dismiss-state";
import { resetStoresForScreen } from "../../stores/utils/reset-stores-for-screen";
import { startScreenTransition } from "../../utils/animation/start-screen-transition";

interface ScreenLifecycleProps {
	children: React.ReactNode;
}

export const ScreenLifecycleController = ({
	children,
}: ScreenLifecycleProps) => {
	const { current } = useKeys();

	const animations = Animations.getAll(current.route.key);

	const handleBeforeRemove = useStableCallback((e: any) => {
		const key = current.navigation.getParent()?.getState().key;
		const requestedDismissOnNavigator = NavigatorDismissState.get(key);

		const isEnabled = current.options.enableTransitions;
		const isRequestedDismissOnNavigator = requestedDismissOnNavigator;
		const isFirstScreen = current.navigation.getState().index === 0;

		// If transitions are disabled, or the dismissal was on the local root, or this is the first screen of the stack, reset the stores
		if (!isEnabled || isRequestedDismissOnNavigator || isFirstScreen) {
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
