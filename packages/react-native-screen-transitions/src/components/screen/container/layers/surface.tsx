import { memo } from "react";
import { StyleSheet } from "react-native";
import { useBuilderStore } from "../../../../providers/screen/builder";
import {
	useSlotProps,
	useSlotStyles,
} from "../../../../providers/screen/orchestrator/styles";
import type { ScreenSurfaceComponentProps } from "../../../../types";
import { LayerComponent } from "../helpers/layer-component";

type Props = {
	children: React.ReactNode;
	pointerEvents: "box-none" | undefined;
};

export const SurfaceLayer = memo(({ children, pointerEvents }: Props) => {
	const SurfaceComponent = useBuilderStore(
		(store) => store.options.surfaceComponent,
	);

	const animatedSurfaceStyle = useSlotStyles("surface");
	const animatedSurfaceProps = useSlotProps("surface");
	const surfaceStyles = [
		styles.surface,
		animatedSurfaceStyle,
	] as ScreenSurfaceComponentProps["styles"];
	const surfaceProps =
		animatedSurfaceProps as ScreenSurfaceComponentProps["props"];

	if (!SurfaceComponent) {
		return children;
	}

	return (
		<LayerComponent
			component={SurfaceComponent}
			styles={surfaceStyles}
			props={surfaceProps}
			pointerEvents={pointerEvents}
		>
			{children}
		</LayerComponent>
	);
});

const styles = StyleSheet.create({
	surface: {
		flex: 1,
	},
});
