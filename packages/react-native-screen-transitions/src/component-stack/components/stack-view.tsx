import {
	NavigationContext,
	NavigationRouteContext,
} from "@react-navigation/native";
import * as React from "react";
import { Fragment } from "react";
import { Overlay } from "../../shared/components/overlay";
import { ScreenComposer } from "../../shared/providers/screen/screen-composer";
import { withStackCore } from "../../shared/providers/stack/core.provider";
import { withManagedStack } from "../../shared/providers/stack/managed.provider";
import { AnimationStore } from "../../shared/stores/animation.store";
import { GestureStore } from "../../shared/stores/gesture.store";
import { StackType } from "../../shared/types/stack.types";
import { resolveSceneNeighbors } from "../../shared/utils/navigation/resolve-scene-neighbors";
import { isScreenOverlayVisible } from "../../shared/utils/overlay/visibility";
import type {
	ComponentStackDescriptor,
	ComponentStackNavigationHelpers,
} from "../types";
import { ComponentScreen } from "./component-screen";

type SceneViewProps = {
	descriptor: ComponentStackDescriptor;
};

const SceneView = React.memo(function SceneView({
	descriptor,
}: SceneViewProps) {
	const { route, navigation, render } = descriptor;

	return (
		<NavigationContext.Provider value={navigation}>
			<NavigationRouteContext.Provider value={route}>
				{isScreenOverlayVisible(descriptor.options) && <Overlay.Screen />}
				{render()}
			</NavigationRouteContext.Provider>
		</NavigationContext.Provider>
	);
});

export const StackView = withStackCore(
	{ TRANSITIONS_ALWAYS_ON: true, STACK_TYPE: StackType.COMPONENT },
	withManagedStack<ComponentStackDescriptor, ComponentStackNavigationHelpers>(
		({ scenes, shouldShowFloatOverlay, closingRouteKeysRef }) => {
			const isRouteClosing = (routeKey: string) => {
				const inClosingSet = closingRouteKeysRef.current.has(routeKey);
				if (inClosingSet) return true;

				const isClosing =
					AnimationStore.getAnimation(routeKey, "closing").value > 0;
				if (isClosing) return true;

				const isDismissing =
					GestureStore.getGesture(routeKey, "isDismissing").value > 0;
				return isDismissing;
			};

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
