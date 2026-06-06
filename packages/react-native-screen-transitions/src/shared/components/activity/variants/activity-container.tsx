import { StyleSheet, View } from "react-native";

import { ScreenContainer } from "react-native-screens";
import { IS_WEB } from "../../../constants";
import { useStack } from "../../../hooks/navigation/use-stack";

interface Props {
	children: React.ReactNode;
}

export const ActivityContainer = ({ children }: Props) => {
	const nativeScreenDisabled = useStack((s) => s.flags.DISABLE_NATIVE_SCREENS);
	const Component = IS_WEB || nativeScreenDisabled ? View : ScreenContainer;
	return (
		<Component collapsable={false} style={styles.container}>
			{children}
		</Component>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});
