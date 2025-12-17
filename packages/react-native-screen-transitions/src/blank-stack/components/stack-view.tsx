import {
	NavigationContext,
	NavigationRouteContext,
} from "@react-navigation/native";
import * as React from "react";
import { Fragment } from "react";
import { StyleSheet } from "react-native";
import { ScreenContainer } from "react-native-screens";
import { Overlay } from "../../shared/components/overlay";
import { withAnimatedLifecycle } from "../../shared/providers/animated-lifecycle.provider";
import { ScreenTransitionProvider } from "../../shared/providers/screen-transition.provider";
import { withStackCore } from "../../shared/providers/stack-core.provider";
import { BlankStackScreenLifecycleController } from "../controllers/blank-stack-lifecycle";
import type { BlankStackDescriptor } from "../types";
import { Screen } from "./screens";

function isFabric() {
	return "nativeFabricUIManager" in global;
}

type SceneViewProps = {
	descriptor: BlankStackDescriptor;
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
	withAnimatedLifecycle(
		({ descriptors, focusedIndex, scenes, shouldShowFloatOverlay }) => {
			return (
				<Fragment>
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

							const isPreloaded = descriptors[route.key] === undefined;

							// On Fabric, when screen is frozen, animated and reanimated values are not updated
							// due to component being unmounted. To avoid this, we don't freeze the previous screen there
							const shouldFreeze = isFabric()
								? !isPreloaded && !isFocused && !isBelowFocused
								: !isPreloaded && !isFocused;
							return (
								<Screen
									key={route.key}
									isPreloaded={isPreloaded}
									index={sceneIndex}
									routeKey={route.key}
									shouldFreeze={shouldFreeze}
									freezeOnBlur={descriptor.options.freezeOnBlur}
								>
									<ScreenTransitionProvider
										previous={previousDescriptor}
										current={descriptor}
										next={nextDescriptor}
										LifecycleController={BlankStackScreenLifecycleController}
									>
										<SceneView key={route.key} descriptor={descriptor} />
									</ScreenTransitionProvider>
								</Screen>
							);
						})}
					</ScreenContainer>
				</Fragment>
			);
		},
	),
);

const styles = StyleSheet.create({
	container: { flex: 1 },
});
