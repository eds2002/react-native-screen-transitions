import Transition from "react-native-screen-transitions";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";

export default function C() {
	return (
		<Transition.View style={styles.container}>
			<Text>C</Text>
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
		backgroundColor: "lightcoral",
	},
});
