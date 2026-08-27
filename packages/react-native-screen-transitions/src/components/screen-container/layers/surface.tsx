import { type ComponentType, memo, useMemo } from "react";
import { StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { useDescriptorsStore } from "../../../providers/screen/descriptors";
import { useSlotProps, useSlotStyles } from "../../../providers/screen/styles";
import type { ScreenSurfaceComponentProps } from "../../../types";
import { usesLayerRenderProps } from "./render-component";

type Props = {
	children: React.ReactNode;
	pointerEvents: "box-none" | undefined;
};

export const SurfaceLayer = memo(({ children, pointerEvents }: Props) => {
	const SurfaceComponent = useDescriptorsStore(
		(store) => store.options.surfaceComponent,
	);

	const AnimatedSurfaceComponent = useMemo(() => {
		return SurfaceComponent && !usesLayerRenderProps(SurfaceComponent)
			? Animated.createAnimatedComponent(SurfaceComponent as ComponentType<any>)
			: null;
	}, [SurfaceComponent]);

	const animatedSurfaceStyle = useSlotStyles("surface");
	const animatedSurfaceProps = useSlotProps("surface");
	const surfaceStyles = [
		styles.surface,
		animatedSurfaceStyle,
	] as ScreenSurfaceComponentProps["styles"];
	const surfaceProps =
		animatedSurfaceProps as ScreenSurfaceComponentProps["props"];

	if (!SurfaceComponent) {
		return children;
	}

	if (AnimatedSurfaceComponent) {
		return (
			<AnimatedSurfaceComponent
				style={surfaceStyles}
				animatedProps={animatedSurfaceProps}
				pointerEvents={pointerEvents}
			>
				{children}
			</AnimatedSurfaceComponent>
		);
	}

	return (
		<SurfaceComponent
			styles={surfaceStyles}
			props={surfaceProps}
			pointerEvents={pointerEvents}
		>
			{children}
		</SurfaceComponent>
	);
});

const styles = StyleSheet.create({
	surface: {
		flex: 1,
	},
});
