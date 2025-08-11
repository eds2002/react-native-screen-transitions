import { useEffect, useLayoutEffect } from "react";
import useStableCallback from "../../hooks/use-stable-callback";
import { useKeys } from "../../providers/keys";
import { Animations } from "../../stores/animations";
import { NavigatorDismissState } from "../../stores/navigator-dismiss-state";
import { resetStoresForScreen } from "../../stores/utils/reset-stores-for-screen";
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

		// Don't run e.preventDefault when the dismissal was on the local root
		if (requestedDismissOnNavigator) {
			resetStoresForScreen(current);
			return;
		}

		// Don't run e.preventDefault when this is the first screen of the stack
		if (current.navigation.getState().index === 0) {
			resetStoresForScreen(current);
			return;
		}

		e.preventDefault();
		const onFinish = (finished: boolean) => {
			if (finished) {
				resetStoresForScreen(current);
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
