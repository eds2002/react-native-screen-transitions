import { router } from "expo-router";
import {
	Pressable,
	StyleSheet,
	Text,
	useWindowDimensions,
	View,
} from "react-native";
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

export default function BoundsSyncSource() {
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

	const { source } = testCase;
	const destination = testCase.destination;
	const sourceBoundary = source.boundary;
	const sourceAnchor = sourceBoundary.anchor ?? "center";
	const destinationAnchor = destination.boundary.anchor ?? "center";
	const containerHeight = height - FORCED_TOP_INSET - HEADER_HEIGHT_ESTIMATE;
	const positionStyle = getBoxPositionStyle(
		source.position,
		source.width,
		source.height,
		width,
		containerHeight,
	);

	// For fullscreen/custom targets, the destination screen may not have a
	// matching Boundary. Use mode="source" to force measurement regardless.
	const needsExplicitMode =
		sourceBoundary?.target === "fullscreen" ||
		typeof sourceBoundary?.target === "object";

	// Source always uses "transform" method for element-level animation.
	// anchor/scaleMode are declared as Boundary props so match().style() reads them.
	const sourceMethod =
		sourceBoundary?.method === "content"
			? "transform"
			: (sourceBoundary?.method ?? "transform");

	return (
		<View style={[styles.container, { paddingTop: FORCED_TOP_INSET }]}>
			<ScreenHeader
				title={`Source: ${testCase.title}`}
				subtitle={`${source.width}x${source.height} @ ${source.position}`}
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
				<Pressable
					onPress={() => {
						router.push("/bounds-sync/destination" as never);
					}}
				>
					<Transition.Boundary
						id={BOUNDARY_TAG}
						mode={needsExplicitMode ? "source" : undefined}
						method={sourceMethod}
						target={sourceBoundary?.target}
						anchor={sourceBoundary?.anchor}
						scaleMode={sourceBoundary?.scaleMode}
						style={[
							styles.box,
							{
								width: source.width,
								height: source.height,
							},
							positionStyle,
						]}
					>
						<Text style={styles.boxLabel}>SRC</Text>
					</Transition.Boundary>
				</Pressable>

				{/* Ghost outline showing where the destination will appear */}
				{!needsExplicitMode && (
					<View
						pointerEvents="none"
						style={[
							styles.ghost,
							{
								width: testCase.destination.width,
								height: testCase.destination.height,
							},
							getBoxPositionStyle(
								testCase.destination.position,
								testCase.destination.width,
								testCase.destination.height,
								width,
								containerHeight,
							),
						]}
					>
						<Text style={styles.ghostLabel}>DST</Text>
					</View>
				)}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#121212",
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
		backgroundColor: "#4a9eff",
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
});
