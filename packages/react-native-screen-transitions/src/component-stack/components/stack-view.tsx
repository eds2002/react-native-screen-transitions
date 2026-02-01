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
import { StackType } from "../../shared/types/stack.types";
import type {
	ComponentStackDescriptor,
	ComponentStackNavigationHelpers,
} from "../types";

function isFabric() {
	return "nativeFabricUIManager" in global;
}

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
	{
		TRANSITIONS_ALWAYS_ON: true,
		STACK_TYPE: StackType.COMPONENT,
		DISABLE_NATIVE_SCREENS: true,
	},
	withManagedStack<ComponentStackDescriptor, ComponentStackNavigationHelpers>(
		({ descriptors, focusedIndex, scenes, shouldShowFloatOverlay }) => {
			return (
				<Fragment>
					{shouldShowFloatOverlay ? <Overlay.Float /> : null}

					<NativeScreenContainer>
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
