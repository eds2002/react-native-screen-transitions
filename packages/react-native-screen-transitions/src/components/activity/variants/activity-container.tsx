import { StyleSheet, View } from "react-native";

interface Props {
	children: React.ReactNode;
}

export const ActivityContainer = ({ children }: Props) => {
	return (
		<View collapsable={false} style={StyleSheet.absoluteFill}>
			{children}
		</View>
	);
};
