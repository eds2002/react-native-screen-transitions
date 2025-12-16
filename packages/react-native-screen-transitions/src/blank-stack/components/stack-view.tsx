import { SafeAreaProviderCompat } from "@react-navigation/elements";
import {
	NavigationContext,
	NavigationRouteContext,
} from "@react-navigation/native";
import * as React from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ScreenContainer } from "react-native-screens";
import { BlankStackScreenLifecycleController } from "../controllers/blank-stack-lifecycle";
import { FlagsProvider } from "../../shared/providers/flags.provider";
import { RoutesProvider } from "../../shared/providers/routes.provider";
import { ScreenTransitionProvider } from "../../shared/providers/screen-transition.provider";
import type { BlankStackDescriptor } from "../types";
import { withStackNavigationProvider } from "../utils/with-stack-navigation";
import { Overlay } from "./overlay";
import { Screen } from "./screens";

function isFabric() {
	return "nativeFabricUIManager" in global;
}

type SceneViewProps = {
	descriptor: BlankStackDescriptor;
};

const SceneView = React.memo(function SceneView({
	descriptor,
}: SceneViewProps) {
	const { route, navigation, render } = descriptor;

	return (
		<NavigationContext.Provider value={navigation}>
			<NavigationRouteContext.Provider value={route}>
				{descriptor.options.overlayMode === "screen" && <Overlay.Screen />}
				{render()}
			</NavigationRouteContext.Provider>
		</NavigationContext.Provider>
	);
});

export const StackView = withStackNavigationProvider(
	({ descriptors, focusedIndex, routes, scenes, shouldShowFloatOverlay }) => {
		// Memoize route keys array for ScenesProvider
		const routeKeys = React.useMemo(
			() => routes.map((route) => route.key),
			[routes],
		);

		return (
			<FlagsProvider TRANSITIONS_ALWAYS_ON>
				<RoutesProvider routeKeys={routeKeys}>
					<GestureHandlerRootView>
						<SafeAreaProviderCompat>
							{shouldShowFloatOverlay ? <Overlay.Float /> : null}
							<ScreenContainer style={styles.container}>
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
											routeKey={route.key}
											shouldFreeze={shouldFreeze}
											freezeOnBlur={descriptor.options.freezeOnBlur}
										>
											<ScreenTransitionProvider
												previous={previousDescriptor}
												current={descriptor}
												next={nextDescriptor}
												LifecycleController={
													BlankStackScreenLifecycleController
												}
											>
												<SceneView key={route.key} descriptor={descriptor} />
											</ScreenTransitionProvider>
										</Screen>
									);
								})}
							</ScreenContainer>
						</SafeAreaProviderCompat>
					</GestureHandlerRootView>
				</RoutesProvider>
			</FlagsProvider>
		);
	},
);

const styles = StyleSheet.create({
	container: { flex: 1 },
});
