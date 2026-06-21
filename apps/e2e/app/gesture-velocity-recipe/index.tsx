import { router } from "expo-router";
import { Button, StyleSheet, View } from "react-native";
import { useTheme } from "@/theme";

export default function GestureVelocityRecipeIndex() {
	const theme = useTheme();

	return (
		<View style={[styles.container, { backgroundColor: theme.bg }]}>
			<Button
				title="Go to test"
				onPress={() => router.push("/gesture-velocity-recipe/test")}
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
