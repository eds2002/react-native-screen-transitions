import { router } from "expo-router";
import { Button, StyleSheet, View } from "react-native";
import { useTheme } from "@/theme";

export default function NativeStackAdapterRecipeIndex() {
	const theme = useTheme();

	return (
		<View style={[styles.container, { backgroundColor: theme.bg }]}>
			<Button
				title="Open Profile"
				onPress={() => router.push("/native-stack-adapter-recipe/profile")}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
});
