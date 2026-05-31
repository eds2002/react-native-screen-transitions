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
		const { stylesMap } = useScreenStyles();

		const animatedSurfaceStyle = useAnimatedStyle(() => {
			"worklet";
			return stylesMap.get().surface?.style ?? NO_STYLES;
		});

		const animatedSurfaceProps = useAnimatedProps(() => {
			"worklet";
			return stylesMap.get().surface?.props ?? NO_PROPS;
		});

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
