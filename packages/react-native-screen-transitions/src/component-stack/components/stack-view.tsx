import { Fragment } from "react";
import { Overlay } from "../../shared/components/overlay";
import { SceneView } from "../../shared/components/scene-view";
import { ScreenComposer } from "../../shared/providers/screen/screen-composer";
import { withStackCore } from "../../shared/providers/stack/core.provider";
import { withManagedStack } from "../../shared/providers/stack/managed.provider";
import { StackType } from "../../shared/types/stack.types";
import { resolveSceneNeighbors } from "../../shared/utils/navigation/resolve-scene-neighbors";
import type {
	ComponentStackDescriptor,
	ComponentStackNavigationHelpers,
} from "../types";
import { ComponentScreen } from "./component-screen";

export const StackView = withStackCore(
	{ TRANSITIONS_ALWAYS_ON: true, STACK_TYPE: StackType.COMPONENT },
	withManagedStack<ComponentStackDescriptor, ComponentStackNavigationHelpers>(
		({ scenes, shouldShowFloatOverlay, closingRouteMap }) => {
			const isRouteClosing = (routeKey: string) =>
				Boolean(closingRouteMap.current[routeKey]);

			return (
				<Fragment>
					{shouldShowFloatOverlay ? <Overlay.Float /> : null}

					{scenes.map((scene, sceneIndex) => {
						const descriptor = scene.descriptor;
						const route = scene.route;

						const { previousDescriptor, nextDescriptor } =
							resolveSceneNeighbors(scenes, sceneIndex, isRouteClosing);

						return (
							<ComponentScreen key={route.key} routeKey={route.key}>
								<ScreenComposer
									previous={previousDescriptor}
									current={descriptor}
									next={nextDescriptor}
								>
									<SceneView key={route.key} descriptor={descriptor} />
								</ScreenComposer>
							</ComponentScreen>
						);
					})}
				</Fragment>
			);
		},
	),
);
