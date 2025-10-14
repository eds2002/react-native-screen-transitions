import {
  NavigationContext,
  NavigationRouteContext,
} from "@react-navigation/native";
import { useMemo } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useScreenAnimation } from "../../../hooks/animation/use-screen-animation";
import { KeysProvider, useKeys } from "../../../providers/keys";
import type {
  BlankStackHeaderProps,
  BlankStackScene,
} from "../../../types/blank-stack.navigator";
import { useStackNavigationContext } from "../utils/with-stack-navigation";

type HeaderHostProps = {
  scene: BlankStackScene;
  focusedIndex: number;
  isFloating?: boolean;
};

const getActiveFloatHeader = (scenes: BlankStackScene[], index: number) => {
  for (let i = index; i >= 0; i--) {
    const scene = scenes[i];
    const options = scene?.descriptor?.options;

    if (options?.headerMode === "float" && options?.headerShown) {
      return { scene, headerIndex: i };
    }
  }

  return null;
};

const HeaderHost = ({ scene, focusedIndex, isFloating }: HeaderHostProps) => {
  const insets = useSafeAreaInsets();
  const animation = useScreenAnimation();

  const HeaderComponent = scene.descriptor.options.header;

  if (!HeaderComponent) {
    return null;
  }

  const headerProps: BlankStackHeaderProps = {
    route: scene.route,
    navigation: scene.descriptor.navigation,
    animation,
    insets,
    focusedIndex,
  };

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.container,
        isFloating ? styles.floating : null,
        styles.absolute,
      ]}
    >
      <NavigationContext.Provider value={scene.descriptor.navigation}>
        <NavigationRouteContext.Provider value={scene.route}>
          <View pointerEvents="auto" style={styles.header}>
            <HeaderComponent {...headerProps} />
          </View>
        </NavigationRouteContext.Provider>
      </NavigationContext.Provider>
    </Animated.View>
  );
};

const FloatHeader = () => {
  const { scenes, focusedIndex } = useStackNavigationContext();

  const activeHeader = useMemo(
    () => getActiveFloatHeader(scenes, focusedIndex),
    [scenes, focusedIndex]
  );

  if (!activeHeader) {
    return null;
  }

  const { scene, headerIndex } = activeHeader;

  const previous = scenes[headerIndex - 1]?.descriptor;
  const current = scene.descriptor;
  const next = scenes[headerIndex + 1]?.descriptor;

  return (
    //@ts-expect-error
    <KeysProvider current={current} previous={previous} next={next}>
      <HeaderHost scene={scene} focusedIndex={focusedIndex} isFloating />
    </KeysProvider>
  );
};

const ScreenHeader = () => {
  const { focusedIndex } = useStackNavigationContext();
  const { current } = useKeys();

  const options = current.options;

  // @ts-expect-error
  if (!options.headerShown || options.headerMode !== "screen") {
    return null;
  }

  const scene: BlankStackScene = {
    //@ts-expect-error
    descriptor: current,
    route: current.route,
  };

  return <HeaderHost scene={scene} focusedIndex={focusedIndex} />;
};

export const Header = {
  Float: FloatHeader,
  Screen: ScreenHeader,
};

const styles = StyleSheet.create({
  header: {
    position: "absolute",
    top: 0,
    start: 0,
    end: 0,
  },
  container: {
    flex: 1,
  },
  absolute: {
    position: "absolute",
    top: 0,
    start: 0,
    end: 0,
  },
  floating: {
    zIndex: 1000,
  },
});
