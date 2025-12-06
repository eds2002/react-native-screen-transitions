import FontAwesome from "@expo/vector-icons/FontAwesome6";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";

export const Header = () => {
	return (
		<View
			style={{
				flexDirection: "row",
				alignItems: "center",
				justifyContent: "space-between",
				width: "100%",
			}}
		>
			<Text style={{ fontSize: 20, fontWeight: "600" }}>Header</Text>
			<Pressable
				onPress={router.back}
				style={{
					width: 30,
					height: 30,
					borderRadius: 50,
					backgroundColor: "#404040",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<FontAwesome name="xmark" size={18} color="#FFF" />
			</Pressable>
		</View>
	);
};
