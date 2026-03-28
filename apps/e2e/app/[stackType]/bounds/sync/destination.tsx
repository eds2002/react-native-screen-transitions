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
import { useTheme } from "@/theme";
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
	const theme = useTheme();

	if (!testCase) {
		return (
			<View
				style={[
					styles.container,
					{ paddingTop: FORCED_TOP_INSET, backgroundColor: theme.bg },
				]}
			>
				<ScreenHeader title="Unknown Case" />
			</View>
		);
	}

	const { destination } = testCase;
	const destinationBoundary = destination.boundary;
	const containerHeight = height - FORCED_TOP_INSET - HEADER_HEIGHT_ESTIMATE;
	const positionStyle = getBoxPositionStyle(
		destination.position,
		destination.width,
		destination.height,
		width,
		containerHeight,
	);

	return (
		<View style={[styles.container, { paddingTop: FORCED_TOP_INSET }]}>
			<View style={{ backgroundColor: theme.bg }}>
				<ScreenHeader
					title={`Dest: ${testCase.title}`}
					subtitle={`${destination.width}x${destination.height} @ ${destination.position}`}
				/>
			</View>
			<Text
				style={[
					styles.behaviorText,
					{ color: theme.textSecondary, backgroundColor: theme.bg },
				]}
			>
				{destination.description}
			</Text>
			<View style={styles.arena}>
				<Transition.Boundary.View
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
							backgroundColor: theme.scenario,
						},
						positionStyle,
					]}
				>
					<Text style={[styles.boxLabel, { color: theme.text }]}>DST</Text>
				</Transition.Boundary.View>

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

			<View style={styles.floatingContainer}>
				<Pressable
					onPress={() => router.back()}
					style={[
						styles.floatingButton,
						{ backgroundColor: theme.actionButton },
					]}
				>
					<Text
						style={[
							styles.floatingButtonText,
							{ color: theme.actionButtonText },
						]}
					>
						Go Back
					</Text>
				</Pressable>
				<Text style={[styles.floatingNote, { color: theme.textTertiary }]}>
					Bounds can work without a .Trigger. However, for most cases this is
					not recommended.
				</Text>
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
	behaviorText: {
		paddingHorizontal: 16,
		paddingBottom: 10,
		fontSize: 12,
		lineHeight: 17,
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
	floatingContainer: {
		position: "absolute",
		bottom: 40,
		alignSelf: "center",
		alignItems: "center",
		gap: 8,
	},
	floatingButton: {
		paddingVertical: 14,
		paddingHorizontal: 28,
		borderRadius: 999,
	},
	floatingButtonText: {
		fontWeight: "600",
		fontSize: 16,
	},
	floatingNote: {
		fontSize: 11,
		fontFamily: "monospace",
		textAlign: "center",
		paddingHorizontal: 32,
	},
});
