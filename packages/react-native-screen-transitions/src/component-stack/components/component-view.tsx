import * as React from "react";
import { StyleSheet } from "react-native";
import { LayoutDimensionsProvider } from "../../shared/providers/layout-dimensions.provider";
import { withStackRootProvider } from "../../shared/providers/stack-root.provider";
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

export const ComponentView = withStackRootProvider(
	{ TRANSITIONS_ALWAYS_ON: true },
	withComponentNavigationProvider(({ scenes, shouldShowFloatOverlay }) => {
		return (
			<>
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
							<Screen key={route.key} index={sceneIndex} routeKey={route.key}>
								<ComponentTransitionProvider
									previous={previousDescriptor}
									current={descriptor}
									next={nextDescriptor}
									LifecycleController={ComponentStackScreenLifecycleController}
								>
									<SceneView key={route.key} descriptor={descriptor} />
								</ComponentTransitionProvider>
							</Screen>
						);
					})}
				</LayoutDimensionsProvider>
			</>
		);
	}),
);

const styles = StyleSheet.create({
	container: { flex: 1 },
});
