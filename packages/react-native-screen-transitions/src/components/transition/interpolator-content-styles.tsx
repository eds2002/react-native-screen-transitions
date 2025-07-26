import { forwardRef } from "react";
import Animated from "react-native-reanimated";
import { useInterpolatorStyles } from "@/hooks/animation/use-interpolator-styles";

interface InterpolatorContentStylesProps {
	children: React.ReactNode;
}

export const InterpolatorContentStyles = forwardRef<
	Animated.View,
	InterpolatorContentStylesProps
>(({ children }, ref) => {
	const { contentStyle } = useInterpolatorStyles();

	return (
		<Animated.View ref={ref} style={[{ flex: 1 }, contentStyle]}>
			{children}
		</Animated.View>
	);
});
