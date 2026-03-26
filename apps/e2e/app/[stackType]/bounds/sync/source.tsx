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
import { useTheme } from "@/theme";
import {
	activeCaseId,
	BOUNDARY_TAG,
	getBoxPositionStyle,
	getCaseById,
} from "./constants";

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

	const { source } = testCase;
	const sourceBoundary = source.boundary;
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
		<View
			style={[
				styles.container,
				{ paddingTop: FORCED_TOP_INSET, backgroundColor: theme.bg },
			]}
		>
			<ScreenHeader
				title={`Source: ${testCase.title}`}
				subtitle={`${source.width}x${source.height} @ ${source.position}`}
			/>

			<Text style={[styles.behaviorText, { color: theme.textSecondary }]}>
				{source.description}
			</Text>
			<View style={styles.arena}>
				<Transition.Boundary.View
					id={BOUNDARY_TAG}
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
					<Text style={[styles.boxLabel, { color: theme.actionButtonText }]}>
						SRC
					</Text>
				</Transition.Boundary.View>

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

			<View style={styles.floatingContainer}>
				<Pressable
					onPress={() => {
						router.push(
							buildStackPath(stackType, "bounds/sync/destination") as never,
						);
					}}
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
						Navigate
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
	floatingNote: {
		fontSize: 11,
		fontFamily: "monospace",
		textAlign: "center",
		paddingHorizontal: 32,
	},
	floatingButtonText: {
		fontWeight: "600",
		fontSize: 16,
	},
});
