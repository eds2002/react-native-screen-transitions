import { memo } from "react";
import { ActivityContainer, ActivityScreen } from "../components/activity";
import { PortalProvider } from "../components/boundary/portal";
import { Overlay } from "../components/overlay";
import { NavigationScreenProvider } from "../providers/navigation/navigation-host.provider";
import { ScreenComposer } from "../providers/screen/screen-composer";
import { withBlankStack } from "../providers/stack/blank-stack.provider";
import { withStackCore } from "../providers/stack/core.provider";
import type {
	BlankStackDescriptor,
	BlankStackNavigationHelpers,
} from "../types/blank-stack.types";
import type { BaseStackScene } from "../types/stack.types";

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
		<NavigationScreenProvider navigation={descriptor.navigation} route={route}>
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
		</NavigationScreenProvider>
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
