import { useEffect } from "react";
import { useAnimatedStyle, useSharedValue } from "react-native-reanimated";

/**
 * This hook helps mitigate a race condition between the JS and UI thread where styles are not applied immediately.
 * By skipping one frame before rendering, it ensures styles are properly applied, removing a flicker effect.
 *
 * Related issue: https://github.com/software-mansion/react-native-reanimated/issues/4446
 */
export const useSkipFirstFrame = () => {
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

	return { style };
};
