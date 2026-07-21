import type { ComponentType } from "react";

export function usesLayerRenderProps(
	component: ComponentType<any>,
): component is ComponentType<Record<string, unknown>> {
	return (
		typeof component === "function" && !component.prototype?.isReactComponent
	);
}
