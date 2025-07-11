import { useNavigation } from "@react-navigation/native";
import { Pressable, Text, View } from "react-native";

export function GroupA() {
	const navigation = useNavigation();

	return (
		<View
			style={{
				flex: 1,
				backgroundColor: "white",
				alignItems: "center",
				justifyContent: "center",
				gap: 8,
			}}
		>
			<Pressable onPress={() => navigation.navigate("GroupB" as never)}>
				<Text style={{ fontSize: 16, fontWeight: "500", color: "blue" }}>
					Go to /group-a/b
				</Text>
			</Pressable>
			<Pressable onPress={() => navigation.goBack()}>
				<Text style={{ fontSize: 14, fontWeight: "500", opacity: 0.5 }}>
					Go back (or swipe left to right)
				</Text>
			</Pressable>
		</View>
	);
}
