import { useMemo } from "react";
import { useWindowDimensions } from "react-native";
import {
  type DerivedValue,
  type SharedValue,
  useDerivedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { HeaderInterpolationProps } from "src/types/animation";
import { useStackNavigationContext } from "../../integrations/blank-stack/utils/with-stack-navigation";
import { useKeys } from "../../providers/keys";
import { Animations } from "../../stores/animations";

/**
 * Aggregates progress values for the header owner and every scene that sits
 * above it in the stack. The result can be consumed by floating headers to
 * drive animations that span multiple screens.
 */
export const useHeaderAnimation =
  (): DerivedValue<HeaderInterpolationProps> => {
    const { current } = useKeys();
    const { scenes } = useStackNavigationContext();

    const progressValues = useMemo<SharedValue<number>[]>(() => {
      const routeKey = current?.route?.key;
      if (!routeKey) {
        return [];
      }

      const headerIndex = scenes.findIndex(
        (scene) => scene.route.key === routeKey
      );

      if (headerIndex === -1) {
        return [];
      }

      return scenes.slice(headerIndex).map((scene) => {
        return Animations.getAnimation(scene.route.key, "progress");
      });
    }, [current?.route?.key, scenes]);

    const accumulatedProgress = useDerivedValue(() => {
      "worklet";

      let total = 0;

      for (let i = 0; i < progressValues.length; i += 1) {
        total += progressValues[i].value;
      }

      return total;
    }, [progressValues]);

    const screen = useWindowDimensions();
    const insets = useSafeAreaInsets();

    return useDerivedValue<HeaderInterpolationProps>(() => ({
      progress: accumulatedProgress.value,
      layouts: {
        screen,
      },
      insets,
    }));
  };
