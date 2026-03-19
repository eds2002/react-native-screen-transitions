import { StyleSheet, View } from "react-native";
import { ScreenContainer } from "react-native-screens";
import { useStack } from "../hooks/navigation/use-stack";

interface Props {
	children: React.ReactNode;
}

export const NativeScreenContainer = ({ children }: Props) => {
	const {
		flags: {
			DISABLE_NATIVE_SCREENS = false,
			DISABLE_NATIVE_SCREEN_CONTAINER = false,
		},
	} = useStack();
	if (!DISABLE_NATIVE_SCREENS && !DISABLE_NATIVE_SCREEN_CONTAINER) {
		return (
			<ScreenContainer style={styles.container}>{children}</ScreenContainer>
		);
	}
	return (
		// Mirror ScreenContainer's native boundary when screens are disabled.
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
