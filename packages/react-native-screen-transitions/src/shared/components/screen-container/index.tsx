import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { useBackdropPointerEvents } from "./hooks/use-backdrop-pointer-events";
import { BackdropLayer } from "./layers/backdrop";
import { ContentLayer } from "./layers/content";

type Props = {
	children: React.ReactNode;
};

export const ScreenContainer = memo(({ children }: Props) => {
	const { pointerEvents, isBackdropActive, backdropBehavior } =
		useBackdropPointerEvents();

	return (
		<View style={styles.container} pointerEvents={pointerEvents}>
			<BackdropLayer
				isBackdropActive={isBackdropActive}
				backdropBehavior={backdropBehavior}
			/>
			<ContentLayer
				pointerEvents={pointerEvents}
				isBackdropActive={isBackdropActive}
			>
				{children}
			</ContentLayer>
		</View>
	);
});

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});
