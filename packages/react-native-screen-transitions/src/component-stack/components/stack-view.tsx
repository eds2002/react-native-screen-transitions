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
import { ComponentStackScreenLifecycleController } from "../controllers/component-stack-lifecycle";
import type {
	ComponentStackDescriptor,
	ComponentStackNavigationHelpers,
} from "../types";
import { ComponentScreen } from "./component-screen";
import { ComponentScreenContainer } from "./component-screen-container";

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
				{descriptor.options.overlayMode === "screen" && <Overlay.Screen />}
				{render()}
			</NavigationRouteContext.Provider>
		</NavigationContext.Provider>
	);
});

export const StackView = withStackCore(
	{ TRANSITIONS_ALWAYS_ON: true },
	withManagedStack<ComponentStackDescriptor, ComponentStackNavigationHelpers>(
		({ scenes, shouldShowFloatOverlay }) => {
			return (
				<Fragment>
					{shouldShowFloatOverlay ? <Overlay.Float /> : null}

					<ComponentScreenContainer>
						{scenes.map((scene, sceneIndex) => {
							const descriptor = scene.descriptor;
							const route = scene.route;

							const previousDescriptor =
								scenes[sceneIndex - 1]?.descriptor ?? undefined;
							const nextDescriptor =
								scenes[sceneIndex + 1]?.descriptor ?? undefined;

							return (
								<ComponentScreen key={route.key} routeKey={route.key}>
									<ScreenComposer
										previous={previousDescriptor}
										current={descriptor}
										next={nextDescriptor}
										LifecycleController={
											ComponentStackScreenLifecycleController
										}
									>
										<SceneView key={route.key} descriptor={descriptor} />
									</ScreenComposer>
								</ComponentScreen>
							);
						})}
					</ComponentScreenContainer>
				</Fragment>
			);
		},
	),
);
