import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

interface Props {
	children: ReactNode;
}

export const ScreenHostContainer = ({ children }: Props) => {
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
