import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import { useActiveBoundsStore } from "./_layout";

export default function ActiveBoundsIndex() {
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title="Active Bounds"
				subtitle="Tap a square to see the bound animate"
			/>
			<View style={styles.content}>
				<View style={styles.grid}>
					{Array.from({ length: 3 }).map((_, rowIdx) => (
						<View key={`row-${rowIdx}`} style={styles.row}>
							{Array.from({ length: 3 }).map((_, colIdx) => {
								const idx = rowIdx * 3 + colIdx;
								const tag = `active-bounds-${idx}`;
								return (
									<Transition.Pressable
										key={tag}
										testID={tag}
										sharedBoundTag={tag}
										style={[
											styles.cell,
											{
												backgroundColor: `hsl(${idx * 40}, 90%, 60%)`,
											},
										]}
										onPress={() => {
											useActiveBoundsStore.setState({
												boundTag: tag,
											});
											router.push({
												pathname:
													"/blank-stack/active-bounds/[id]" as `/blank-stack/active-bounds/${string}`,
												params: { id: tag },
											});
										}}
									>
										<Text style={styles.cellText}>{idx + 1}</Text>
									</Transition.Pressable>
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
