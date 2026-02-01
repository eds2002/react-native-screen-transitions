import { StyleSheet, View } from "react-native";
import { ScreenContainer } from "react-native-screens";
import { useStack } from "../hooks/navigation/use-stack";

interface Props {
	children: React.ReactNode;
}

export const NativeScreenContainer = ({ children }: Props) => {
	const {
		flags: { DISABLE_NATIVE_SCREENS = false },
	} = useStack();
	if (!DISABLE_NATIVE_SCREENS) {
		return (
			<ScreenContainer style={styles.container}>{children}</ScreenContainer>
		);
	}
	return <View style={styles.container}>{children}</View>;
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});
