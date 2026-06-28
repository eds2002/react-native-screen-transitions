import { type ComponentType, memo, useMemo } from "react";
import { StyleSheet, type ViewProps } from "react-native";
import Animated from "react-native-reanimated";
import { useDescriptors } from "../../../providers/screen/descriptors";
import { useSlotProps, useSlotStyles } from "../../../providers/screen/styles";

type Props = {
	children: React.ReactNode;
	pointerEvents: ViewProps["pointerEvents"];
};

export const SurfaceContainer = memo(({ children, pointerEvents }: Props) => {
	const { current } = useDescriptors();

	const SurfaceComponent = current.options.surfaceComponent;

	const AnimatedSurfaceComponent = useMemo<ComponentType<any> | null>(() => {
		return SurfaceComponent
			? Animated.createAnimatedComponent(SurfaceComponent)
			: null;
	}, [SurfaceComponent]);

	if (!AnimatedSurfaceComponent) return children;

	return (
		<AnimatedSurface
			SurfaceComponent={AnimatedSurfaceComponent}
			pointerEvents={pointerEvents}
		>
			{children}
		</AnimatedSurface>
	);
});

type AnimatedSurfaceProps = {
	children: React.ReactNode;
	pointerEvents: ViewProps["pointerEvents"];
	SurfaceComponent: ComponentType<any>;
};

const AnimatedSurface = memo(
	({ children, pointerEvents, SurfaceComponent }: AnimatedSurfaceProps) => {
		const animatedSurfaceStyle = useSlotStyles("surface");
		const animatedSurfaceProps = useSlotProps("surface");

		return (
			<SurfaceComponent
				style={[styles.surface, animatedSurfaceStyle]}
				animatedProps={animatedSurfaceProps}
				pointerEvents={pointerEvents}
			>
				{children}
			</SurfaceComponent>
		);
	},
);

const styles = StyleSheet.create({
	surface: {
		flex: 1,
	},
});
