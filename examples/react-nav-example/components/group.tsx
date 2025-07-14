import { StyleSheet, TouchableOpacity } from "react-native";

export const Group = ({
	children,
	onPress,
}: {
	children: React.ReactNode;
	onPress: () => void;
}) => {
	return (
		<TouchableOpacity
			style={styles.group}
			onPress={onPress}
			activeOpacity={0.8}
		>
			{children}
		</TouchableOpacity>
	);
};

const styles = StyleSheet.create({
	group: {
		gap: 4,
		padding: 16,
		backgroundColor: "#FFF",
		width: "100%",
		borderRadius: 24,
	},
});
