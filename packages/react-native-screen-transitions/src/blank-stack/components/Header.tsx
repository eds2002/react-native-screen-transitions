import {
  NavigationContext,
  NavigationRouteContext,
} from "@react-navigation/native";
import { useMemo } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KeysProvider, useKeys } from "../../shared/providers/keys";
import type {
  BlankStackDescriptor,
  BlankStackHeaderProps,
  BlankStackScene,
} from "../types";
import { useStackNavigationContext } from "../utils/with-stack-navigation";
import { useHeaderAnimation } from "../hooks/use-header-animation";

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

  const HeaderComponent = scene.descriptor.options.header;

  const animation = useHeaderAnimation();

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
          <View pointerEvents="box-none" style={styles.header}>
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
    <KeysProvider current={current} previous={previous} next={next}>
      <HeaderHost scene={scene} focusedIndex={focusedIndex} isFloating />
    </KeysProvider>
  );
};

const ScreenHeader = () => {
  const { focusedIndex } = useStackNavigationContext();
  const { current } = useKeys();

  const options = current.options;

  if (!options.headerShown || options.headerMode !== "screen") {
    return null;
  }

  const scene: BlankStackScene = {
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
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  container: {
    flex: 1,
  },
  absolute: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floating: {
    zIndex: 1000,
  },
});
