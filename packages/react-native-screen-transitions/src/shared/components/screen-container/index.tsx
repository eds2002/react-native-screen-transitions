import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { useBackdropPointerEvents } from "./hooks/use-backdrop-pointer-events";
import { BackdropLayer } from "./layers/backdrop";
import { ContentLayer } from "./layers/content";

type Props = {
	children: React.ReactNode;
};

export const ScreenContainer = memo(({ children }: Props) => {
	const { pointerEvents } = useBackdropPointerEvents();

	return (
		<View style={styles.container} pointerEvents={pointerEvents}>
			<BackdropLayer />
			<ContentLayer>{children}</ContentLayer>
		</View>
	);
});

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});
