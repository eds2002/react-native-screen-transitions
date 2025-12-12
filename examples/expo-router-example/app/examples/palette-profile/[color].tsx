import { router, useLocalSearchParams } from "expo-router";
import { Pressable, useWindowDimensions } from "react-native";
import Animated, {
	interpolate,
	useAnimatedStyle,
} from "react-native-reanimated";
import Transition, {
	useScreenAnimation,
} from "react-native-screen-transitions";

export default function PaletteProfile() {
	const { color, sharedBoundTag } = useLocalSearchParams<{
		color: string;
		sharedBoundTag: string;
	}>();

	const { width } = useWindowDimensions();
	const screenProps = useScreenAnimation();

	const animatedTextStyle = useAnimatedStyle(() => {
		"worklet";
		const {
			current: { progress },
		} = screenProps.value;
		return {
			opacity: interpolate(progress, [0, 1], [0, 1]),
		};
	});

	return (
		<Pressable
			style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
			onPress={router.back}
		>
			<Transition.View
				sharedBoundTag={sharedBoundTag}
				style={{
					backgroundColor: color,
					width: width * 0.9,
					height: width * 0.9,
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<Animated.Text
					style={[
						{ color: "black", fontSize: 18, fontWeight: "600" },
						animatedTextStyle,
					]}
				>
					{color}
				</Animated.Text>
			</Transition.View>
		</Pressable>
	);
}
