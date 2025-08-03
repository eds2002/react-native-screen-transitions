import { router } from "expo-router";
import { Pressable, Text } from "react-native";
import Animated, {
	interpolate,
	useAnimatedStyle,
} from "react-native-reanimated";
import { useScreenAnimation } from "react-native-screen-transitions";

/**
 * Example of how to define animations at the screen level.
 */
export default function Custom() {
	const props = useScreenAnimation();

	const animatedStyle = useAnimatedStyle(() => {
		const {
			progress,
			layouts: {
				screen: { width },
			},
		} = props.value;
		return {
			transform: [
				{
					translateX: interpolate(progress, [0, 1], [width, 0]),
				},
			],
			backgroundColor: "#ccffcc",
			flex: 1,
			alignItems: "center",
			justifyContent: "center",
		};
	});

	return (
		<Animated.View style={animatedStyle}>
			<Pressable onPress={router.back}>
				<Text>Go Back</Text>
			</Pressable>
		</Animated.View>
	);
}
