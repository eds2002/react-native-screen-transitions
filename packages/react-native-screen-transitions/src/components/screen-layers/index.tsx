import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { useIsPreloadedScene } from "../../providers/preloaded-scene-context";
import { useBackdropPointerEvents } from "./hooks/use-backdrop-pointer-events";
import { BackdropLayer } from "./layers/backdrop";
import { ContentLayer } from "./layers/content";

export type ScreenLayersProps = {
	children: React.ReactNode;
	onDismissRequest?: () => void;
};

export const ScreenLayers = memo(
	({ children, onDismissRequest }: ScreenLayersProps) => {
		const preloaded = useIsPreloadedScene();
		const { pointerEvents, isBackdropActive, backdropBehavior } =
			useBackdropPointerEvents();

		return (
			<View style={styles.container} pointerEvents={pointerEvents}>
				{!preloaded && (
					<BackdropLayer
						onDismissRequest={onDismissRequest}
						isBackdropActive={isBackdropActive}
						backdropBehavior={backdropBehavior}
					/>
				)}
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
