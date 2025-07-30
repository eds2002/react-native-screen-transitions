import { type StyleProps, useAnimatedStyle } from "react-native-reanimated";
import { useScreenAnimation } from "@/navigator/components/providers/screen-animation-provider";
import type { ScreenInterpolationProps } from "@/types";
import { additionalInterpolationProps } from "@/utils/animation/additional-interpolation-props";

/**
 * A helper hook that extends useAnimatedStyle but with our additional props.
 */
export const _useAnimatedStyle = <T extends StyleProps>(
	callback: (props: ScreenInterpolationProps) => T,
) => {
	const baseProps = useScreenAnimation();

	return useAnimatedStyle(() => {
		"worklet";
		const modifiedProps = additionalInterpolationProps(baseProps);
		return callback(modifiedProps);
	});
};
