import { StyleSheet, View } from "react-native";

export default function E() {
	return (
		<View style={styles.container}>
			<View style={styles.square} />
		</View>
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
