import { useEffect } from "react";
import { Animated } from "react-native";
import { useAnimatedStyle, useSharedValue } from "react-native-reanimated";

interface FlickerPreventionProps {
	children: React.ReactNode;
}

/**
 * This is personally not my favorite solution, but for now seems like a bandaid fix to flickers. 
 */
export const FlickerPrevention = ({ children }: FlickerPreventionProps) => {
	const opacity = useSharedValue(0);
	const style = useAnimatedStyle(() => {
		"worklet";
		return {
			opacity: opacity.value,
		};
	});

	useEffect(() => {
		const id = requestAnimationFrame(() => {
			opacity.value = 1;
		});
		return () => cancelAnimationFrame(id);
	}, [opacity]);

	return <Animated.View style={[{ flex: 1 }, style]}>{children}</Animated.View>;
};
