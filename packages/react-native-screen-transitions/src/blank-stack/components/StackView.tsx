import { SafeAreaProviderCompat } from "@react-navigation/elements";
import {
  NavigationContext,
  NavigationRouteContext,
} from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ScreenContainer } from "react-native-screens";
import type { BlankStackDescriptor } from "../types";
import { withStackNavigationProvider } from "../utils/with-stack-navigation";
import { Overlay } from "./Overlay";
import { Screen } from "./Screens";
import { ScreenTransitionProvider } from "../../shared/providers/screen-transition-provider";
import { BlankStackScreenLifecycleController } from "../../shared/components/controllers/screen-lifecycle";


function isFabric() {
  return "nativeFabricUIManager" in global;
}

type SceneViewProps = {
  descriptor: BlankStackDescriptor;
  isFocused: boolean;
  sceneIndex: number;
};

const SceneView = ({ descriptor }: SceneViewProps) => {
  const { route, navigation, render } = descriptor;

  return (
    <NavigationContext.Provider value={navigation}>
      <NavigationRouteContext.Provider value={route}>
        {descriptor.options.overlayMode === "screen" && <Overlay.Screen />}
        {render()}
      </NavigationRouteContext.Provider>
    </NavigationContext.Provider>
  );
};

export const StackView = withStackNavigationProvider(
  ({
    activeScreensLimit,
    descriptors,
    focusedIndex,
    routes,
    scenes,
    shouldShowFloatOverlay,
  }) => {
    return (
      <GestureHandlerRootView>
        <SafeAreaProviderCompat>
          {shouldShowFloatOverlay ? <Overlay.Float /> : null}
          <ScreenContainer style={{ flex: 1 }}>
            {scenes.map((scene, sceneIndex) => {
              const descriptor = scene.descriptor;
              const route = scene.route;
              const isFocused = focusedIndex === sceneIndex;
              const isBelowFocused = focusedIndex - 1 === sceneIndex;

              const previousDescriptor =
                scenes[sceneIndex - 1]?.descriptor ?? undefined;
              const nextDescriptor =
                scenes[sceneIndex + 1]?.descriptor ?? undefined;

              const isPreloaded = descriptors[route.key] === undefined;

              // On Fabric, when screen is frozen, animated and reanimated values are not updated
              // due to component being unmounted. To avoid this, we don't freeze the previous screen there
              const shouldFreeze = isFabric()
                ? !isPreloaded && !isFocused && !isBelowFocused
                : !isPreloaded && !isFocused;
              return (
                <Screen
                  key={route.key}
                  isPreloaded={isPreloaded}
                  index={sceneIndex}
                  activeScreensLimit={activeScreensLimit}
                  routeKey={route.key}
                  routes={routes}
                  shouldFreeze={shouldFreeze}
                  freezeOnBlur={descriptor.options.freezeOnBlur}
                >
                  <ScreenTransitionProvider
                    previous={previousDescriptor}
                    current={descriptor}
                    next={nextDescriptor}
                    LifecycleController={BlankStackScreenLifecycleController}
                  >
                    <SceneView
                      key={route.key}
                      isFocused={isFocused}
                      sceneIndex={sceneIndex}
                      descriptor={descriptor}
                    />
                  </ScreenTransitionProvider>
                </Screen>
              );
            })}
          </ScreenContainer>
        </SafeAreaProviderCompat>
      </GestureHandlerRootView>
    );
  }
);
