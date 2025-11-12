import { useEffect, useLayoutEffect } from "react";
import { useParentGestureRegistry } from "../../hooks/gestures/use-parent-gesture-registry";
import useStableCallback from "../../hooks/use-stable-callback";
import { useKeys } from "../../providers/keys";
import { Animations } from "../../stores/animations";
import { NavigatorDismissState } from "../../stores/navigator-dismiss-state";
import { resetStoresForScreen } from "../../stores/utils/reset-stores-for-screen";
import { startScreenTransition } from "../../utils/animation/start-screen-transition";
import { useStackNavigationContext } from "../../../blank-stack/utils/with-stack-navigation";
import { BlankStackDescriptor } from "../../../blank-stack/types";
import { runOnJS, useAnimatedReaction } from "react-native-reanimated";
import { NativeStackDescriptor } from "../../../native-stack/types";

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

const CLOSED_THRESHOLD = 1e-3;

/**
 * ScreenLifecycleController built out for Blank Stack implementation.
 */

export const BlankStackScreenLifecycleController = ({
  children,
}: ScreenLifecycleProps) => {
  const { current } = useKeys<BlankStackDescriptor>();
  const { handleCloseRoute, closingRouteKeysShared, markRouteClosingFinished } =
    useStackNavigationContext();

  const animations = Animations.getAll(current.route.key);

  const handleInitialize = useStableCallback(() => {
    startScreenTransition({
      target: "open",
      spec: current.options.transitionSpec,
      animations,
    });
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
      closing: animations.closing.value,
      progress: animations.progress.value,
      animating: animations.animating.value,
    }),
    ({ keys, closing, progress, animating }) => {
      if (!keys.includes(current.route.key)) {
        return;
      }

      const isFullyClosed = progress <= CLOSED_THRESHOLD;

      const notifyCloseComplete = () => {
        runOnJS(markRouteClosingFinished)(current.route.key);
        runOnJS(handleCloseEnd)(true);
      };

      if (isFullyClosed) {
        if (closing < 1) {
          animations.closing.value = 1;
        }
        notifyCloseComplete();
        return;
      }

      if (closing === 1 && animating === 0) {
        notifyCloseComplete();
        return;
      }

      if (animating !== 1) {
        startScreenTransition({
          target: "close",
          spec: current.options.transitionSpec,
          animations,
          onAnimationFinish: handleCloseEnd,
        });
      }
    }
  );

  useLayoutEffect(handleInitialize);

  // important for t.a scrollviews inside nested navigators.
  useParentGestureRegistry();

  return children;
};
