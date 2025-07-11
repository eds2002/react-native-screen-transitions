import { useNavigation } from "@react-navigation/native";
import { Pressable, StyleSheet, Text } from "react-native";
import Transition from "react-native-screen-transitions";

export function ScreenC() {
	const navigation = useNavigation();

	return (
		<Transition.View style={styles.container}>
			<Text>C</Text>
			<Pressable onPress={() => navigation.goBack()}>
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
