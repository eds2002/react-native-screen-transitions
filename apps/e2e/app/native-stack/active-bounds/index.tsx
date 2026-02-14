import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";

export default function ActiveBoundsIndex() {
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title="Active Bounds"
				subtitle="Transition.Boundary id-only (group optional)"
			/>
			<View style={styles.content}>
				<View style={styles.grid}>
					{Array.from({ length: 3 }).map((_, rowIdx) => (
						<View key={`row-${rowIdx}`} style={styles.row}>
							{Array.from({ length: 3 }).map((_, colIdx) => {
								const idx = rowIdx * 3 + colIdx;
								const tag = `active-bounds-${idx}`;
								return (
									<Pressable
										key={tag}
										testID={tag}
										style={styles.cell}
										onPress={() => {
											router.push(
												`/native-stack/active-bounds/${tag}` as never,
											);
										}}
									>
										<Transition.Boundary
											id={tag}
											style={[
												styles.cellBoundary,
												{
													backgroundColor: `hsl(${idx * 40}, 90%, 60%)`,
												},
											]}
										>
											<Text style={styles.cellText}>{idx + 1}</Text>
										</Transition.Boundary>
									</Pressable>
								);
							})}
						</View>
					))}
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#121212",
	},
	content: {
		flex: 1,
		padding: 16,
	},
	grid: {
		gap: 4,
		marginTop: 16,
	},
	row: {
		flexDirection: "row",
		gap: 4,
	},
	cell: {
		flex: 1,
		aspectRatio: 1,
	},
	cellBoundary: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 8,
	},
	cellText: {
		color: "#fff",
		fontWeight: "600",
		fontSize: 16,
	},
});
