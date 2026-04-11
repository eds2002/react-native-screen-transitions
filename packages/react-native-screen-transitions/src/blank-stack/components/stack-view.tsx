import {
	NavigationContext,
	NavigationRouteContext,
} from "@react-navigation/native";
import { Fragment } from "react";
import { StyleSheet, View } from "react-native";
import { Overlay } from "../../shared/components/overlay";
import { ScreenHost } from "../../shared/components/screen-host/screen-host";
import { ScreenComposer } from "../../shared/providers/screen/screen-composer";
import { withStackCore } from "../../shared/providers/stack/core.provider";
import { withManagedStack } from "../../shared/providers/stack/managed.provider";
import { resolveSceneNeighbors } from "../../shared/utils/navigation/resolve-scene-neighbors";
import type {
	BlankStackDescriptor,
	BlankStackNavigationHelpers,
} from "../types";

export const StackView = withStackCore(
	{ TRANSITIONS_ALWAYS_ON: true, DISABLE_NATIVE_SCREENS: true },
	withManagedStack<BlankStackDescriptor, BlankStackNavigationHelpers>(
		({ descriptors, scenes, shouldShowFloatOverlay, closingRouteMap }) => {
			const isRouteClosing = (routeKey: string) =>
				Boolean(closingRouteMap.current[routeKey]);

			return (
				<Fragment>
					{shouldShowFloatOverlay ? <Overlay.Float /> : null}
					<View collapsable={false} style={styles.container}>
						{scenes.map((scene, sceneIndex) => {
							const descriptor = scene.descriptor;
							const route = scene.route;

							const { previousDescriptor, nextDescriptor } =
								resolveSceneNeighbors(scenes, sceneIndex, isRouteClosing);

							const isPreloaded = descriptors[route.key] === undefined;

							return (
								<ScreenHost
									key={route.key}
									isPreloaded={isPreloaded}
									index={sceneIndex}
									routeKey={route.key}
									inactiveBehavior={descriptor.options.inactiveBehavior}
								>
									<ScreenComposer
										previous={previousDescriptor}
										current={descriptor}
										next={nextDescriptor}
									>
										<NavigationContext.Provider value={descriptor.navigation}>
											<NavigationRouteContext.Provider value={route}>
												{descriptor.render?.()}
											</NavigationRouteContext.Provider>
										</NavigationContext.Provider>
									</ScreenComposer>
								</ScreenHost>
							);
						})}
					</View>
				</Fragment>
			);
		},
	),
);

const styles = StyleSheet.create({
	container: { flex: 1 },
});
