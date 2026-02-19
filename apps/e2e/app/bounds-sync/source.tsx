import { router } from "expo-router";
import {
	Pressable,
	StyleSheet,
	Text,
	useWindowDimensions,
	View,
} from "react-native";
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

export default function BoundsSyncSource() {
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

	const { source } = testCase;
	const sourceBoundary = source.boundary;
	const containerHeight = height - insets.top - 60;
	const positionStyle = getBoxPositionStyle(
		source.position,
		source.width,
		source.height,
		width,
		containerHeight,
	);

	// For fullscreen/custom targets, the destination screen may not have a
	// matching Boundary. Use role="source" to force measurement regardless.
	const needsExplicitRole =
		sourceBoundary?.target === "fullscreen" ||
		typeof sourceBoundary?.target === "object";

	// Source always uses "transform" method for element-level animation.
	// anchor/scaleMode are declared as Boundary props so match().style() reads them.
	const sourceMethod =
		sourceBoundary?.method === "content"
			? "transform"
			: (sourceBoundary?.method ?? "transform");

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title={`Source: ${testCase.title}`}
				subtitle={`${source.width}x${source.height} @ ${source.position}`}
			/>
			<View style={styles.arena}>
				<Pressable
					onPress={() => {
						router.push("/bounds-sync/destination" as never);
					}}
				>
						<Transition.Boundary
							id={BOUNDARY_TAG}
							role={needsExplicitRole ? "source" : undefined}
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
				{!needsExplicitRole && (
					<View
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
		</SafeAreaView>
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
