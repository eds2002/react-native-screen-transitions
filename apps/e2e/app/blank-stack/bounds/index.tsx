import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import { activeBoundaryId, BOUNDARY_GROUP, ITEMS } from "./constants";

export default function BoundsIndex() {
	return (
		<SafeAreaView style={styles.container} edges={[]}>
			<ScreenHeader
				title="Boundary (v2)"
				subtitle="Dynamic retargeting · 6-item grid"
			/>
			<View style={styles.content}>
				<View style={styles.grid}>
					{ITEMS.map((item) => (
						<Pressable
							key={item.id}
							testID={`bounds-open-${item.id}`}
							onPress={() => {
								activeBoundaryId.value = item.id;
								router.push(`/blank-stack/bounds/${item.id}`);
							}}
							style={styles.cell}
						>
							<Transition.Boundary
								group={BOUNDARY_GROUP}
								id={item.id}
								style={[styles.source, { backgroundColor: item.color }]}
							>
								<Text style={styles.sourceText}>{item.label}</Text>
							</Transition.Boundary>
						</Pressable>
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
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 20,
	},
	grid: {
		width: "100%",
		maxWidth: 380,
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "space-between",
		gap: 16,
	},
	cell: {
		width: "31%",
		aspectRatio: 1,
	},
	source: {
		width: "100%",
		height: "100%",
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
	},
	sourceText: {
		color: "#fff",
		fontWeight: "700",
		fontSize: 24,
	},
});
