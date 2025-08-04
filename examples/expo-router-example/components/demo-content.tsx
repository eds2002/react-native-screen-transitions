import { StyleSheet, Text, View } from "react-native";

export const DemoContent = ({
	title,
	description,
}: {
	title: string;
	description: string;
}) => {
	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<Text style={styles.title}>{title}</Text>
				<Text style={styles.description}>{description}</Text>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		padding: 24,
		gap: 36,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "white",
		borderRadius: 36,
	},
	header: {
		gap: 2,
	},
	title: {
		fontSize: 24,
		fontWeight: "600",
	},
	description: {
		fontSize: 14,
		color: "gray",
		fontWeight: "400",
	},
});
