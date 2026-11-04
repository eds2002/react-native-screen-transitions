import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { useBackdropPointerEvents } from "./hooks/use-backdrop-pointer-events";
import { BackdropLayer } from "./layers/backdrop";
import { ContentLayer } from "./layers/content";

export type ScreenLayersProps = {
	children: React.ReactNode;
	onDismissRequest?: () => void;
};

export const ScreenLayers = memo(
	({ children, onDismissRequest }: ScreenLayersProps) => {
		const { pointerEvents, isBackdropActive, backdropBehavior } =
			useBackdropPointerEvents();

		return (
			<View style={styles.container} pointerEvents={pointerEvents}>
				<BackdropLayer
					onDismissRequest={onDismissRequest}
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
	},
);

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});
