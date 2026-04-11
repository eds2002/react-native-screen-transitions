import {
	NavigationContext,
	NavigationRouteContext,
} from "@react-navigation/native";
import { Fragment } from "react";
import { NativeScreen } from "../../shared/components/native-screen";
import { NativeScreenContainer } from "../../shared/components/native-screen-container";
import { Overlay } from "../../shared/components/overlay";
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

					<NativeScreenContainer>
						{scenes.map((scene, sceneIndex) => {
							const descriptor = scene.descriptor;
							const route = scene.route;

							const { previousDescriptor, nextDescriptor } =
								resolveSceneNeighbors(scenes, sceneIndex, isRouteClosing);

							const isPreloaded = descriptors[route.key] === undefined;

							return (
								<NativeScreen
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
								</NativeScreen>
							);
						})}
					</NativeScreenContainer>
				</Fragment>
			);
		},
	),
);
