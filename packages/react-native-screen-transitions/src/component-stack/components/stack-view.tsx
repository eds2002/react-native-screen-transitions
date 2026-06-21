import { Fragment } from "react";
import { Overlay } from "../../shared/components/overlay";
import { SceneView } from "../../shared/components/scene-view";
import { ScreenComposer } from "../../shared/providers/screen/screen-composer";
import { withBlankStack } from "../../shared/providers/stack/blank-stack.provider";
import { withStackCore } from "../../shared/providers/stack/core.provider";
import { StackType } from "../../shared/types/stack.types";
import type {
	ComponentStackDescriptor,
	ComponentStackNavigationHelpers,
} from "../types";
import { ComponentScreen } from "./component-screen";

export const StackView = withStackCore(
	{ TRANSITIONS_ALWAYS_ON: true, STACK_TYPE: StackType.COMPONENT },
	withBlankStack<ComponentStackDescriptor, ComponentStackNavigationHelpers>(
		({ scenes, shouldShowFloatOverlay }) => {
			return (
				<Fragment>
					{shouldShowFloatOverlay ? <Overlay.Float /> : null}

					{scenes.map((scene) => {
						const descriptor = scene.descriptor;
						const route = scene.route;

						return (
							<ComponentScreen key={route.key} routeKey={route.key}>
								<ScreenComposer
									previous={scene.previousDescriptor}
									current={descriptor}
									next={scene.nextDescriptor}
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
