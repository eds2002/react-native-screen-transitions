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

export const ScreenLifecycleController = ({
  children,
}: ScreenLifecycleProps) => {
  const { current } = useKeys<BlankStackDescriptor>();
  const progress = Animations.getAll(current.route.key);
  const { handleCloseRoute, closingRouteKeysShared } =
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
    () => closingRouteKeysShared.value,
    (keys) => {
      if (keys.includes(current.route.key)) {
        if (progress.closing.value === 1) {
          runOnJS(handleCloseEnd)(true);
          return;
        }

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
