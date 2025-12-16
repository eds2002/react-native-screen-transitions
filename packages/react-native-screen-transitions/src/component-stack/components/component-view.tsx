import { SafeAreaProviderCompat } from "@react-navigation/elements";
import * as React from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { FlagsProvider } from "../../shared/providers/flags.provider";
import { LayoutDimensionsProvider } from "../../shared/providers/layout-dimensions.provider";
import { RoutesProvider } from "../../shared/providers/routes.provider";
import { ComponentStackScreenLifecycleController } from "../controllers/component-stack-lifecycle";
import { ComponentTransitionProvider } from "../providers/component-transition.provider";
import type { ComponentStackDescriptor } from "../types";
import { withComponentNavigationProvider } from "../utils/with-component-navigation";
import { Overlay } from "./overlay";
import { Screen } from "./screens";

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
							<LayoutDimensionsProvider>
								{scenes.map((scene, sceneIndex) => {
									const descriptor = scene.descriptor;
									const route = scene.route;

									const previousDescriptor =
										scenes[sceneIndex - 1]?.descriptor ?? undefined;
									const nextDescriptor =
										scenes[sceneIndex + 1]?.descriptor ?? undefined;

									return (
										<Screen
											key={route.key}
											index={sceneIndex}
											routeKey={route.key}
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
							</LayoutDimensionsProvider>
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
