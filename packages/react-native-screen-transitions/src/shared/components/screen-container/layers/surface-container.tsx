import { type ComponentType, memo, useMemo } from "react";
import { StyleSheet, type ViewProps } from "react-native";
import Animated, {
	useAnimatedProps,
	useAnimatedStyle,
} from "react-native-reanimated";
import { NO_PROPS, NO_STYLES } from "../../../constants";
import { useDescriptors } from "../../../providers/screen/descriptors";
import { useScreenStyles } from "../../../providers/screen/styles";

type Props = {
	children: React.ReactNode;
	pointerEvents: ViewProps["pointerEvents"];
};

export const SurfaceContainer = memo(({ children, pointerEvents }: Props) => {
	const { layerStylesMap } = useScreenStyles();
	const { current } = useDescriptors();

	const SurfaceComponent = current.options.surfaceComponent;

	const AnimatedSurfaceComponent = useMemo<ComponentType<any> | null>(() => {
		return SurfaceComponent
			? Animated.createAnimatedComponent(SurfaceComponent)
			: null;
	}, [SurfaceComponent]);

	const animatedSurfaceStyle = useAnimatedStyle(() => {
		"worklet";
		return layerStylesMap.value.surface?.style ?? NO_STYLES;
	});

	const animatedSurfaceProps = useAnimatedProps(() => {
		"worklet";
		return layerStylesMap.value.surface?.props ?? NO_PROPS;
	});

	if (!AnimatedSurfaceComponent) return children;

	return (
		<AnimatedSurfaceComponent
			style={[styles.surface, animatedSurfaceStyle]}
			animatedProps={animatedSurfaceProps}
			pointerEvents={pointerEvents}
		>
			{children}
		</AnimatedSurfaceComponent>
	);
});

const styles = StyleSheet.create({
	surface: {
		flex: 1,
	},
});
