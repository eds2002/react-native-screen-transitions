import * as React from "react";
import { Fragment } from "react";
import { StyleSheet, View } from "react-native";
import { Overlay } from "../../shared/components/overlay";
import { ScreenComposer } from "../../shared/providers/screen/screen-composer";
import { withStackCore } from "../../shared/providers/stack/core.provider";
import { withManagedStack } from "../../shared/providers/stack/managed.provider";
import { ComponentStackScreenLifecycleController } from "../controllers/component-stack-lifecycle";
import type { ComponentStackDescriptor } from "../types";
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

export const ComponentView = withStackCore(
	{ TRANSITIONS_ALWAYS_ON: true },
	withManagedStack(({ scenes, shouldShowFloatOverlay }) => {
		return (
			<Fragment>
				{shouldShowFloatOverlay ? <Overlay.Float /> : null}
				<View style={styles.container}>
					{scenes.map((scene, sceneIndex) => {
						const descriptor =
							scene.descriptor as unknown as ComponentStackDescriptor;
						const route = scene.route;

						const previousDescriptor = scenes[sceneIndex - 1]
							?.descriptor as unknown as ComponentStackDescriptor | undefined;
						const nextDescriptor = scenes[sceneIndex + 1]
							?.descriptor as unknown as ComponentStackDescriptor | undefined;

						return (
							<Screen key={route.key} index={sceneIndex} routeKey={route.key}>
								<ScreenComposer
									previous={previousDescriptor}
									current={descriptor}
									next={nextDescriptor}
									LifecycleController={ComponentStackScreenLifecycleController}
								>
									<SceneView key={route.key} descriptor={descriptor} />
								</ScreenComposer>
							</Screen>
						);
					})}
				</View>
			</Fragment>
		);
	}),
);

const styles = StyleSheet.create({
	container: { flex: 1 },
});
