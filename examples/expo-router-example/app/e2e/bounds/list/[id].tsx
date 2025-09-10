import { router, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import Transition from "react-native-screen-transitions";

export default function ListScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	return (
		<View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
			<Transition.Pressable
				sharedBoundTag={`${id}-icon`}
				style={{ width: 100, height: 100, backgroundColor: "red" }}
				onPress={router.back}
				measureOnLayout
			/>
		</View>
	);
}
