import { useNavigation } from "@react-navigation/native";
import { Pressable, Text } from "react-native";
import Animated, {
	interpolate,
	useAnimatedStyle,
} from "react-native-reanimated";
import { useScreenAnimation } from "react-native-screen-transitions";

export default function Custom() {
	const {
		current,
		layouts: {
			screen: { width },
		},
	} = useScreenAnimation();

	const animatedStyle = useAnimatedStyle(() => {
		return {
			transform: [
				{
					translateX: interpolate(current.progress.value, [0, 1], [width, 0]),
				},
			],
			backgroundColor: "#ccffcc",
			flex: 1,
			alignItems: "center",
			justifyContent: "center",
		};
	});

	const navigation = useNavigation();
	return (
		<Animated.View style={animatedStyle}>
			<Pressable onPress={navigation.goBack}>
				<Text>Go Back</Text>
			</Pressable>
		</Animated.View>
	);
}
