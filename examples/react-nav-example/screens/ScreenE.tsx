import { StyleSheet, View } from "react-native";
import Transition from "react-native-screen-transitions";

export function ScreenE() {
	return (
		<Transition.View style={styles.container}>
			<View style={styles.square} />
		</Transition.View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 48,
	},
	square: {
		width: 150,
		height: 150,
		borderRadius: 64,
		backgroundColor: "lightblue",
	},
});
