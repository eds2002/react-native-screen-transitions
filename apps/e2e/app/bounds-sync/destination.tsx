import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import {
	SafeAreaView,
	useSafeAreaInsets,
} from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import {
	activeCaseId,
	BOUNDARY_TAG,
	getBoxPositionStyle,
	getCaseById,
} from "./constants";

export default function BoundsSyncDestination() {
	const { width, height } = useWindowDimensions();
	const insets = useSafeAreaInsets();
	const caseId = activeCaseId.value;
	const testCase = getCaseById(caseId);

	if (!testCase) {
		return (
			<SafeAreaView style={styles.container}>
				<ScreenHeader title="Unknown Case" />
			</SafeAreaView>
		);
	}

	const { destination } = testCase;
	const destinationBoundary = destination.boundary;
	const containerHeight = height - insets.top - 60;
	const positionStyle = getBoxPositionStyle(
		destination.position,
		destination.width,
		destination.height,
		width,
		containerHeight,
	);

	// For fullscreen/custom targets, the source uses role="source" and there
	// is no matching Boundary on this screen — the target override handles it.
	const hasTargetOverride =
		destinationBoundary?.target === "fullscreen" ||
		typeof destinationBoundary?.target === "object";

	const infoLines = [
		`method: ${destinationBoundary?.method ?? "transform"}`,
		destinationBoundary?.scaleMode
			? `scaleMode: ${destinationBoundary.scaleMode}`
			: null,
		destinationBoundary?.anchor ? `anchor: ${destinationBoundary.anchor}` : null,
		destinationBoundary?.target
			? `target: ${
					typeof destinationBoundary.target === "string"
						? destinationBoundary.target
						: "custom"
				}`
			: null,
	].filter(Boolean);

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title={`Dest: ${testCase.title}`}
				subtitle={`${destination.width}x${destination.height} @ ${destination.position}`}
			/>
			<View style={styles.arena}>
					{!hasTargetOverride && (
						<Transition.Boundary
							id={BOUNDARY_TAG}
							method={destinationBoundary?.method}
							target={destinationBoundary?.target}
							anchor={destinationBoundary?.anchor}
							scaleMode={destinationBoundary?.scaleMode}
						style={[
							styles.box,
							{
								width: destination.width,
								height: destination.height,
							},
							positionStyle,
						]}
					>
						<Text style={styles.boxLabel}>DST</Text>
					</Transition.Boundary>
				)}

				{/* Ghost outline showing where the source was */}
				<View
					style={[
						styles.ghost,
						{
							width: testCase.source.width,
							height: testCase.source.height,
						},
						getBoxPositionStyle(
							testCase.source.position,
							testCase.source.width,
							testCase.source.height,
							width,
							containerHeight,
						),
					]}
				>
					<Text style={styles.ghostLabel}>SRC</Text>
				</View>
			</View>

			{/* Debug info */}
			<View style={styles.infoBar}>
				{infoLines.map((line) => (
					<Text key={line} style={styles.infoText}>
						{line}
					</Text>
				))}
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	arena: {
		flex: 1,
		position: "relative",
	},
	box: {
		position: "absolute",
		backgroundColor: "#ff6b35",
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
	},
	boxLabel: {
		color: "#fff",
		fontWeight: "700",
		fontSize: 14,
	},
	ghost: {
		position: "absolute",
		borderRadius: 12,
		borderWidth: 2,
		borderColor: "rgba(255, 255, 255, 0.15)",
		borderStyle: "dashed",
		alignItems: "center",
		justifyContent: "center",
	},
	ghostLabel: {
		color: "rgba(255, 255, 255, 0.2)",
		fontWeight: "600",
		fontSize: 12,
	},
	infoBar: {
		paddingHorizontal: 16,
		paddingVertical: 12,
		backgroundColor: "#1a1a1a",
		borderTopWidth: 1,
		borderTopColor: "#333",
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 12,
	},
	infoText: {
		fontSize: 11,
		color: "#4a9eff",
		fontFamily: "monospace",
	},
});
