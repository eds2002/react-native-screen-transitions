import {
	NavigationContext,
	NavigationRouteContext,
} from "@react-navigation/native";
import * as React from "react";
import type { BaseStackDescriptor } from "../types/stack.types";
import { isScreenOverlayVisible } from "../utils/overlay/visibility";
import { Overlay } from "./overlay";

type SceneViewProps = {
	descriptor: BaseStackDescriptor;
};

/**
 * Shared scene view for managed stacks (blank-stack, component-stack).
 * Wraps screen render output with navigation context providers
 * and optional screen overlay.
 */
export const SceneView = React.memo(function SceneView({
	descriptor,
}: SceneViewProps) {
	const { route, navigation, render } = descriptor;

	return (
		<NavigationContext.Provider value={navigation as any}>
			<NavigationRouteContext.Provider value={route}>
				{isScreenOverlayVisible(descriptor.options) && <Overlay.Screen />}
				{render?.()}
			</NavigationRouteContext.Provider>
		</NavigationContext.Provider>
	);
});
