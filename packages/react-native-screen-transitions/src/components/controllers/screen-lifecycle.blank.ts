import type React from "react";
import { useLayoutEffect } from "react";
import { runOnJS, useAnimatedReaction } from "react-native-reanimated";

import { useParentGestureRegistry } from "../../hooks/gestures/use-parent-gesture-registry";
import useStableCallback from "../../hooks/use-stable-callback";
import { useStackNavigationContext } from "../../integrations/blank-stack/utils/with-stack-navigation";
import { useKeys } from "../../providers/keys";
import { Animations } from "../../stores/animations";
import type { BlankStackDescriptor } from "../../types/blank-stack.navigator";
import { startScreenTransition } from "../../utils/animation/start-screen-transition";

interface ScreenLifecycleProps {
  children: React.ReactNode;
}

const CLOSED_THRESHOLD = 1e-3;

export const ScreenLifecycleController = ({
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
