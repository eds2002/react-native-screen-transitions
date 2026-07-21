import { useCallback } from "react";
import type { LayoutRectangle } from "react-native";
import { useAnimatedStyle, useSharedValue } from "react-native-reanimated";

export const usePlaceholderStyles = () => {
	const placeholderWidth = useSharedValue(0);
	const placeholderHeight = useSharedValue(0);
	// Pin the placeholder to its measured size while content lives in the host,
	// in the same UI frame the host name flips - no commit in between. Until the
	// first layout lands (dims 0) sizing stays natural so an instant attach
	// cannot collapse the slot.
	const placeholderStyle = useAnimatedStyle(() => {
		"worklet";
		const width = placeholderWidth.get();
		const height = placeholderHeight.get();

		if (width === 0) {
			return { width: "auto", height: "auto" } as const;
		}

		return { width, height };
	});

	const handleOnLayout = useCallback(
		(layout: LayoutRectangle) => {
			"worklet";
			const { width, height } = layout;
			if (width === 0 || height === 0) {
				return;
			}

			const hasValidDimensions =
				placeholderHeight.get() !== 0 && placeholderWidth.get() !== 0;

			if (!hasValidDimensions) {
				placeholderWidth.set(width);
				placeholderHeight.set(height);
			}
		},
		[placeholderHeight, placeholderWidth],
	);

	return { placeholderStyle, handleOnLayout };
};
