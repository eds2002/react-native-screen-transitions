import { Fragment } from "react";
import { Overlay } from "../../shared/components/overlay";
import { SceneView } from "../../shared/components/scene-view";
import { ScreenHost } from "../../shared/components/screen-host";
import { ScreenHostContainer } from "../../shared/components/screen-host-container";
import { ScreenComposer } from "../../shared/providers/screen/screen-composer";
import { withStackCore } from "../../shared/providers/stack/core.provider";
import { withManagedStack } from "../../shared/providers/stack/managed.provider";
import { resolveSceneNeighbors } from "../../shared/utils/navigation/resolve-scene-neighbors";
import type {
	BlankStackDescriptor,
	BlankStackNavigationHelpers,
} from "../types";

export const StackView = withStackCore(
	withManagedStack<BlankStackDescriptor, BlankStackNavigationHelpers>(
		({ scenes, shouldShowFloatOverlay, closingRouteMap }) => {
			const isRouteClosing = (routeKey: string) =>
				Boolean(closingRouteMap.current[routeKey]);

			return (
				<Fragment>
					{shouldShowFloatOverlay ? <Overlay.Float /> : null}

					<ScreenHostContainer>
						{scenes.map((scene, sceneIndex) => {
							const descriptor = scene.descriptor;
							const route = scene.route;

							const { previousDescriptor, nextDescriptor } =
								resolveSceneNeighbors(scenes, sceneIndex, isRouteClosing);

							return (
								<ScreenHost
									key={route.key}
									index={sceneIndex}
									routeKey={route.key}
								>
									<ScreenComposer
										previous={previousDescriptor}
										current={descriptor}
										next={nextDescriptor}
									>
										<SceneView key={route.key} descriptor={descriptor} />
									</ScreenComposer>
								</ScreenHost>
							);
						})}
					</ScreenHostContainer>
				</Fragment>
			);
		},
	),
);
