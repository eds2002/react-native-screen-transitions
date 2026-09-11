import { type ComponentType, type ReactNode, useMemo } from "react";
import type { ViewProps } from "react-native";
import Animated from "react-native-reanimated";
import type { ScreenLayerComponentProps } from "../../../../types";
import { usesLayerRenderProps } from "./uses-layer-render-props";

/** Adapts the two supported custom layer APIs without changing component identity. */
export function LayerComponent({
	component,
	styles,
	props,
	pointerEvents,
	children,
	collapsable,
}: ScreenLayerComponentProps & {
	component?: ComponentType<any>;
	children?: ReactNode;
	collapsable?: ViewProps["collapsable"];
}) {
	const renderProps = component && usesLayerRenderProps(component);
	const Component = useMemo<ComponentType<any>>(() => {
		if (!component) return Animated.View;
		return usesLayerRenderProps(component)
			? component
			: Animated.createAnimatedComponent(component);
	}, [component]);
	return (
		<Component
			{...(renderProps
				? { styles, props }
				: { style: styles, animatedProps: props })}
			pointerEvents={pointerEvents}
			collapsable={collapsable}
		>
			{children}
		</Component>
	);
}
