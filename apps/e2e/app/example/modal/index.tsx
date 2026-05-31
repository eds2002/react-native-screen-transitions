import { router, useFocusEffect, useNavigation } from "expo-router";
import { useCallback } from "react";
import { Button, Text, View } from "react-native";
import { useTheme } from "@/theme";

export default function ModalIndex() {
	const theme = useTheme();
	const navigation = useNavigation();

	useFocusEffect(
		useCallback(() => {
			navigation.getParent().setOptions({
				gestureEnabled: true,
			});
		}, [navigation]),
	);
	return (
		<View
			style={{
				flex: 1,
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<Button title="Go to B" onPress={() => navigation.navigate("b")} />
			<Text style={{ fontSize: 11, opacity: 0.5, color: theme.text }}>
				This screen is currently dismissable.
			</Text>
		</View>
	);
}
