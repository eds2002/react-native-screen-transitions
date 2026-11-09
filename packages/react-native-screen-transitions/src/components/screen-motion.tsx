import type { ReactNode } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";
import { MotionProvider } from "../providers/motion";
import type { MotionValues } from "../providers/motion/types";
import { OrchestratorProvider } from "../providers/orchestrator";
import { ScreenLayers } from "./screen-layers";

/**
 * What every animated screen renders inside its BuilderProvider, whether a navigator's or a
 * `Transition.Motion` unit's: its motion, its orchestrator and its layers, with the content
 * inside them and the lifecycle (which reads the motion) beside them.
 */
export function ScreenMotion({
	values,
	onDismissRequest,
	pointerEvents,
	lifecycle,
	children,
}: {
	/** Values made outside the screen (a `useMotion` handle); a navigator's screen makes its own. */
	values?: MotionValues;
	onDismissRequest?: () => void;
	/** Set to let touches through the screen's content while it is closed or closing. */
	pointerEvents?: ViewProps["pointerEvents"];
	lifecycle: ReactNode;
	children: ReactNode;
}) {
	const layers = (
		<OrchestratorProvider>
			<ScreenLayers onDismissRequest={onDismissRequest}>
				{children}
			</ScreenLayers>
		</OrchestratorProvider>
	);
	return (
		<MotionProvider values={values} onDismissRequest={onDismissRequest}>
			{pointerEvents === undefined ? (
				layers
			) : (
				<View style={styles.fill} pointerEvents={pointerEvents}>
					{layers}
				</View>
			)}
			{lifecycle}
		</MotionProvider>
	);
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
