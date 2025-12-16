import { SafeAreaProviderCompat } from "@react-navigation/elements";
import * as React from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ScreenContainer } from "react-native-screens";
import { FlagsProvider } from "../../shared/providers/flags.provider";
import { RoutesProvider } from "../../shared/providers/routes.provider";
import { ComponentStackScreenLifecycleController } from "../controllers/component-stack-lifecycle";
import { ComponentTransitionProvider } from "../providers/component-transition.provider";
import type { ComponentStackDescriptor } from "../types";
import { withComponentNavigationProvider } from "../utils/with-component-navigation";
import { Overlay } from "./overlay";
import { Screen } from "./screens";

function isFabric() {
	return "nativeFabricUIManager" in global;
}

type SceneViewProps = {
	descriptor: ComponentStackDescriptor;
};

const SceneView = React.memo(function SceneView({
	descriptor,
}: SceneViewProps) {
	return (
		<>
			{descriptor.options.overlayMode === "screen" && <Overlay.Screen />}
			{descriptor.render()}
		</>
	);
});

export const ComponentView = withComponentNavigationProvider(
	({ focusedIndex, routes, scenes, shouldShowFloatOverlay }) => {
		// Memoize route keys array for RoutesProvider
		const routeKeys = React.useMemo(
			() => routes.map((route) => route.key),
			[routes],
		);

		return (
			<FlagsProvider TRANSITIONS_ALWAYS_ON>
				<RoutesProvider routeKeys={routeKeys}>
					<GestureHandlerRootView style={styles.container}>
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

									// On Fabric, when screen is frozen, animated and reanimated values are not updated
									// due to component being unmounted. To avoid this, we don't freeze the previous screen there
									const shouldFreeze = isFabric()
										? !isFocused && !isBelowFocused
										: !isFocused;

									return (
										<Screen
											key={route.key}
											index={sceneIndex}
											routeKey={route.key}
											shouldFreeze={shouldFreeze}
											freezeOnBlur={descriptor.options.freezeOnBlur}
										>
											<ComponentTransitionProvider
												previous={previousDescriptor}
												current={descriptor}
												next={nextDescriptor}
												LifecycleController={
													ComponentStackScreenLifecycleController
												}
											>
												<SceneView key={route.key} descriptor={descriptor} />
											</ComponentTransitionProvider>
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
