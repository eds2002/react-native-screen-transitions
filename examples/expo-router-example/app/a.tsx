import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function A() {
	return (
		<View style={styles.container}>
			<Text>A</Text>
			<Pressable onPress={router.back}>
				<Text>Go back</Text>
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "lightblue",
	},
});
