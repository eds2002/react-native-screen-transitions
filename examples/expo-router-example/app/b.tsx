import { router } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";
import Transition from "react-native-screen-transitions";

export default function B() {
	return (
		<Transition.View style={styles.container}>
			<Text>B</Text>
			<Pressable onPress={router.back}>
				<Text>Go back</Text>
			</Pressable>
		</Transition.View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "lightgreen",
	},
});
