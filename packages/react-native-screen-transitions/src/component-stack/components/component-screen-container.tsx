import { StyleSheet, View } from "react-native";

interface Props {
	children: React.ReactNode;
}

export const ComponentScreenContainer = ({ children }: Props) => {
	return <View style={styles.container}>{children}</View>;
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});
