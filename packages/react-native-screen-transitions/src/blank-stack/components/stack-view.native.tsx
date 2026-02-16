import {
	NavigationContext,
	NavigationRouteContext,
} from "@react-navigation/native";
import * as React from "react";
import { Fragment } from "react";
import { NativeScreen } from "../../shared/components/native-screen";
import { NativeScreenContainer } from "../../shared/components/native-screen-container";
import { Overlay } from "../../shared/components/overlay";
import { ScreenComposer } from "../../shared/providers/screen/screen-composer";
import { withStackCore } from "../../shared/providers/stack/core.provider";
import { withManagedStack } from "../../shared/providers/stack/managed.provider";
import { AnimationStore } from "../../shared/stores/animation.store";
import { GestureStore } from "../../shared/stores/gesture.store";
import { resolveSceneNeighbors } from "../../shared/utils/navigation/resolve-scene-neighbors";
import { isScreenOverlayVisible } from "../../shared/utils/overlay/visibility";
import type {
	BlankStackDescriptor,
	BlankStackNavigationHelpers,
} from "../types";

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
				{isScreenOverlayVisible(descriptor.options) && <Overlay.Screen />}
				{render()}
			</NavigationRouteContext.Provider>
		</NavigationContext.Provider>
	);
});

export const StackView = withStackCore(
	{ TRANSITIONS_ALWAYS_ON: true, DISABLE_NATIVE_SCREENS: false },
	withManagedStack<BlankStackDescriptor, BlankStackNavigationHelpers>(
		({
			descriptors,
			focusedIndex,
			scenes,
			shouldShowFloatOverlay,
			closingRouteKeysRef,
		}) => {
			const isRouteClosing = (routeKey: string) => {
				const inClosingSet = closingRouteKeysRef.current.has(routeKey);
				if (inClosingSet) return true;

				const isClosing =
					AnimationStore.getAnimation(routeKey, "closing").value > 0;

				if (isClosing) return true;

				return false;
			};

			return (
				<Fragment>
					{shouldShowFloatOverlay ? <Overlay.Float /> : null}

					<NativeScreenContainer>
						{scenes.map((scene, sceneIndex) => {
							const descriptor = scene.descriptor;
							const route = scene.route;
							const isFocused = focusedIndex === sceneIndex;
							const isBelowFocused = focusedIndex - 1 === sceneIndex;

							const { previousDescriptor, nextDescriptor } =
								resolveSceneNeighbors(scenes, sceneIndex, isRouteClosing);

							const isPreloaded = descriptors[route.key] === undefined;

							// On Fabric, when screen is frozen, animated and reanimated values are not updated
							// due to component being unmounted. To avoid this, we don't freeze the previous screen there
							const shouldFreeze = isFabric()
								? !isPreloaded && !isFocused && !isBelowFocused
								: !isPreloaded && !isFocused;
							return (
								<NativeScreen
									key={route.key}
									isPreloaded={isPreloaded}
									index={sceneIndex}
									routeKey={route.key}
									shouldFreeze={shouldFreeze}
									freezeOnBlur={descriptor.options.freezeOnBlur}
								>
									<ScreenComposer
										previous={previousDescriptor}
										current={descriptor}
										next={nextDescriptor}
									>
										<SceneView key={route.key} descriptor={descriptor} />
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
