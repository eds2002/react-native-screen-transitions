import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import {
	activeCaseId,
	BOUNDARY_TAG,
	getBoxPositionStyle,
	getCaseById,
} from "./constants";

const FORCED_TOP_INSET = 59;
const HEADER_HEIGHT_ESTIMATE = 60;

export default function BoundsSyncDestination() {
	const { width, height } = useWindowDimensions();
	const caseId = activeCaseId.value;
	const testCase = getCaseById(caseId);

	if (!testCase) {
		return (
			<View style={[styles.container, { paddingTop: FORCED_TOP_INSET }]}>
				<ScreenHeader title="Unknown Case" />
			</View>
		);
	}

	const { destination } = testCase;
	const source = testCase.source;
	const destinationBoundary = destination.boundary;
	const sourceAnchor = source.boundary.anchor ?? "center";
	const destinationAnchor = destinationBoundary.anchor ?? "center";
	const containerHeight = height - FORCED_TOP_INSET - HEADER_HEIGHT_ESTIMATE;
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
		`scope: element | method: ${destinationBoundary?.method ?? "transform"}`,
		destinationBoundary?.scaleMode
			? `scaleMode: ${destinationBoundary.scaleMode}`
			: null,
		destinationBoundary?.anchor
			? `anchor: ${destinationBoundary.anchor}`
			: null,
		destinationBoundary?.target
			? `target: ${
					typeof destinationBoundary.target === "string"
						? destinationBoundary.target
						: "custom"
				}`
			: null,
	].filter(Boolean);

	return (
		<View style={[styles.container, { paddingTop: FORCED_TOP_INSET }]}>
			<ScreenHeader
				title={`Dest: ${testCase.title}`}
				subtitle={`${destination.width}x${destination.height} @ ${destination.position}`}
			/>
			<Text style={styles.concernText}>
				Concern: Element transition, not navigation transition
			</Text>
			<Text style={styles.anchorNoteText}>
				Anchor selects the alignment point (e.g. center), not a fixed top-left
				lock.
			</Text>
			<Text style={styles.anchorPairText}>
				sourceAnchor: {sourceAnchor} | destinationAnchor: {destinationAnchor}
			</Text>
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
					pointerEvents="none"
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
		</View>
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
	concernText: {
		paddingHorizontal: 16,
		paddingBottom: 4,
		fontSize: 11,
		color: "#7fa5cf",
		fontFamily: "monospace",
	},
	anchorNoteText: {
		paddingHorizontal: 16,
		paddingBottom: 4,
		fontSize: 11,
		color: "#97abc3",
		fontFamily: "monospace",
	},
	anchorPairText: {
		paddingHorizontal: 16,
		paddingBottom: 10,
		fontSize: 11,
		color: "#89a4c4",
		fontFamily: "monospace",
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
