import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
	screen: {
		flex: 1,
		padding: 24,
		gap: 36,
	},
	screenCentered: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 24,
	},
	screenTitle: {
		fontSize: 24,
		fontWeight: "600",
		textAlign: "center",
	},
	screenDesc: {
		fontSize: 14,
		fontWeight: "500",
		opacity: 0.7,
		textAlign: "center",
	},
	title: {
		fontSize: 18,
		fontWeight: "600",
	},
	description: {
		fontSize: 14,
		color: "gray",
		fontWeight: "500",
	},
});
