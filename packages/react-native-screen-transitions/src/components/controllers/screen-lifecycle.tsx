import { useEffect, useLayoutEffect } from "react";
import { useKeys } from "../../context/keys";
import useStableCallback from "../../hooks/use-stable-callback";
import { Animations } from "../../stores/animations";
import { Bounds } from "../../stores/bounds";
import { Gestures } from "../../stores/gestures";
import { NavigatorDismissState } from "../../stores/navigator-dismiss-state";
import { runTransition } from "../../utils/animation/run-transition";

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

		const cleanup = () => {
			Animations.clear(current.route.key);
			Gestures.clear(current.route.key);
			Bounds.clear(current.route.key);
			Bounds.clearActive();
		};

		// Don't run e.preventDefault when the dismissal was on the local root
		if (requestedDismissOnNavigator) {
			cleanup();
			return;
		}

		// Don't run e.preventDefault when this is the first screen of the stack
		if (current.navigation.getState().index === 0) {
			cleanup();
			return;
		}

		e.preventDefault();
		const onFinish = (finished: boolean) => {
			if (finished) {
				cleanup();
				current.navigation.dispatch(e.data.action);
			}
		};

		runTransition({
			target: "close",
			spec: current.options.transitionSpec,
			onFinish,
			animations,
		});
	});

	const handleInitialize = useStableCallback(() => {
		runTransition({
			target: "open",
			spec: current.options.transitionSpec,
			animations,
		});
	});

	useLayoutEffect(handleInitialize, []);

	useEffect(() => {
		const unsubscribe = current.navigation.addListener(
			"beforeRemove",
			handleBeforeRemove,
		);

		return unsubscribe;
	}, [current.navigation, handleBeforeRemove]);

	return children;
};
