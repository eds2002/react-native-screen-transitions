import { useLocalSearchParams } from "expo-router";
import { useWindowDimensions, View } from "react-native";
import Transition from "react-native-screen-transitions";

export default function ActiveBoundsScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const { width } = useWindowDimensions();
	return (
		<View
			style={{
				flex: 1,
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<Transition.View
				sharedBoundTag={id}
				style={{
					backgroundColor: "red",
					width: width * 0.9,
					height: width * 0.9,
				}}
			/>
		</View>
	);
}
