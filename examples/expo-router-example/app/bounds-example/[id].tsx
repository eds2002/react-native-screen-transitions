import { router, useLocalSearchParams } from "expo-router";
import { Image, Text, useWindowDimensions, View } from "react-native";
import Animated, {
	interpolate,
	useAnimatedStyle,
} from "react-native-reanimated";
import Transition, {
	useScreenAnimation,
} from "react-native-screen-transitions";
import { data } from ".";

export default function BoundsDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();

	const { width } = useWindowDimensions();
	const {
		current: { progress },
	} = useScreenAnimation();

	const animatedStyle = useAnimatedStyle(() => {
		return {
			opacity: progress.value,
			transform: [
				{
					translateY: interpolate(progress.value, [0.25, 1], [50, 0], "clamp"),
				},
				{
					scale: interpolate(progress.value, [0.25, 1], [0, 1], "clamp"),
				},
			],
		};
	});

	const title = data.find((item) => item.id === id)?.title;
	const description = data.find((item) => item.id === id)?.description;

	return (
		<View style={{ flex: 1 }}>
			<Transition.Pressable
				onPress={router.back}
				style={{
					width: width,
					height: width,
					alignItems: "center",
					justifyContent: "center",
					flex: 0,
				}}
				sharedBoundTag={id}
			>
				<Image
					source={{ uri: data.find((item) => item.id === id)?.image }}
					style={{ width: width, height: width }}
				/>
			</Transition.Pressable>
			<Animated.View
				style={[
					{
						flex: 1,
						padding: 36,
					},
					animatedStyle,
				]}
			>
				<Text style={{ color: "#000", fontSize: 36, fontWeight: "600" }}>
					{title}
				</Text>
				<Text
					style={{
						color: "#000",
						fontSize: 20,
						fontWeight: "500",
						opacity: 0.75,
					}}
				>
					{description}
				</Text>
			</Animated.View>
		</View>
	);
}
