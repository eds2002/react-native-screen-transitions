import {
	NavigationContext,
	NavigationRouteContext,
} from "@react-navigation/native";
import { memo } from "react";
import {
	ActivityContainer,
	ActivityScreen,
} from "../../shared/components/activity";
import { PortalProvider } from "../../shared/components/integrations/portal";
import { Overlay } from "../../shared/components/overlay";
import { ScreenComposer } from "../../shared/providers/screen/screen-composer";
import { withBlankStack } from "../../shared/providers/stack/blank-stack.provider";
import { withStackCore } from "../../shared/providers/stack/core.provider";
import type { BaseStackScene } from "../../shared/types/stack.types";
import type {
	BlankStackDescriptor,
	BlankStackNavigationHelpers,
} from "../types";

interface BlankSceneRowProps {
	scene: BaseStackScene<BlankStackDescriptor>;
	paintDriverRouteKey?: string;
}

const BlankSceneRow = memo(function BlankSceneRow({
	scene,
	paintDriverRouteKey,
}: BlankSceneRowProps) {
	const descriptor = scene.descriptor;
	const route = scene.route;

	return (
		<NavigationContext.Provider value={descriptor.navigation}>
			<NavigationRouteContext.Provider value={route}>
				<ActivityScreen
					activity={descriptor.activity}
					inactiveBehavior={descriptor.options.inactiveBehavior}
					paintDriverRouteKey={paintDriverRouteKey}
					hasNestedState={"state" in route}
				>
					<ScreenComposer
						previous={scene.previousDescriptor}
						current={descriptor}
						next={scene.nextDescriptor}
					>
						{descriptor.render?.()}
					</ScreenComposer>
				</ActivityScreen>
			</NavigationRouteContext.Provider>
		</NavigationContext.Provider>
	);
});

export const StackView = withStackCore(
	{ TRANSITIONS_ALWAYS_ON: true, DISABLE_NATIVE_SCREENS: false },
	withBlankStack<BlankStackDescriptor, BlankStackNavigationHelpers>(
		({ scenes, shouldShowFloatOverlay }) => {
			return (
				<PortalProvider>
					{shouldShowFloatOverlay ? <Overlay.Float /> : null}

					<ActivityContainer>
						{scenes.map((scene, index) => {
							const route = scene.route;
							const paintDriverRouteKey = scenes[index + 2]?.route.key;

							return (
								<BlankSceneRow
									key={route.key}
									scene={scene}
									paintDriverRouteKey={paintDriverRouteKey}
								/>
							);
						})}
					</ActivityContainer>
				</PortalProvider>
			);
		},
	),
);
