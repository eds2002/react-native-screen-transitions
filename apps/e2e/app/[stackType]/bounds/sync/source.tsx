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
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import {
	activeCaseId,
	BOUNDARY_TAG,
	getBoxPositionStyle,
	getCaseById,
} from "./constants";
import { useTheme } from "@/theme";

const FORCED_TOP_INSET = 59;
const HEADER_HEIGHT_ESTIMATE = 60;

export default function BoundsSyncSource() {
	const stackType = useResolvedStackType();
	const { width, height } = useWindowDimensions();
	const caseId = activeCaseId.value;
	const testCase = getCaseById(caseId);
	const theme = useTheme();

	if (!testCase) {
		return (
			<View style={[styles.container, { paddingTop: FORCED_TOP_INSET, backgroundColor: theme.bg }]}>
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

	const needsExplicitMode =
		sourceBoundary?.target === "fullscreen" ||
		typeof sourceBoundary?.target === "object";

	const sourceMethod =
		sourceBoundary?.method === "content"
			? "transform"
			: (sourceBoundary?.method ?? "transform");

	return (
		<View style={[styles.container, { paddingTop: FORCED_TOP_INSET, backgroundColor: theme.bg }]}>
			<ScreenHeader
				title={`Source: ${testCase.title}`}
				subtitle={`${source.width}x${source.height} @ ${source.position}`}
			/>
			<Text style={[styles.concernText, { color: theme.textSecondary }]}>
				Concern: Element transition, not navigation transition
			</Text>
			<Text style={[styles.anchorNoteText, { color: theme.textSecondary }]}>
				Anchor selects the alignment point (e.g. center), not a fixed top-left
				lock.
			</Text>
			<Text style={[styles.anchorPairText, { color: theme.textSecondary }]}>
				sourceAnchor: {sourceAnchor} | destinationAnchor: {destinationAnchor}
			</Text>
			<View style={styles.arena}>
				<Pressable
					onPress={() => {
						router.push(
							buildStackPath(stackType, "bounds/sync/destination") as never,
						);
					}}
				>
					<Transition.Boundary.View
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
								backgroundColor: theme.actionButton,
							},
							positionStyle,
						]}
					>
						<Text style={[styles.boxLabel, { color: theme.actionButtonText }]}>SRC</Text>
					</Transition.Boundary.View>
				</Pressable>

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
	},
	arena: {
		flex: 1,
		position: "relative",
	},
	concernText: {
		paddingHorizontal: 16,
		paddingBottom: 4,
		fontSize: 11,
		fontFamily: "monospace",
	},
	anchorNoteText: {
		paddingHorizontal: 16,
		paddingBottom: 4,
		fontSize: 11,
		fontFamily: "monospace",
	},
	anchorPairText: {
		paddingHorizontal: 16,
		paddingBottom: 10,
		fontSize: 11,
		fontFamily: "monospace",
	},
	box: {
		position: "absolute",
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
	},
	boxLabel: {
		fontWeight: "700",
		fontSize: 14,
	},
	ghost: {
		position: "absolute",
		borderRadius: 14,
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
