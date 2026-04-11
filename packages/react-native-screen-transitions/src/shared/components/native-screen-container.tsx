import { StyleSheet, View } from "react-native";

interface Props {
	children: React.ReactNode;
}

export const NativeScreenContainer = ({ children }: Props) => {
	return (
		<View collapsable={false} style={styles.container}>
			{children}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});
