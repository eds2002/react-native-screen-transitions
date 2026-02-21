import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import { buildStackPath, useResolvedStackType } from "@/components/stack-examples/stack-routing";

const ITEMS = [
	{ id: "alpine", color: "#4f7cff", title: "Alpine Vista" },
	{ id: "desert", color: "#ff6b35", title: "Desert Sunset" },
	{ id: "ocean", color: "#18a999", title: "Ocean Depth" },
	{ id: "golden", color: "#f4b400", title: "Golden Hour" },
	{ id: "twilight", color: "#8b5cf6", title: "Twilight" },
	{ id: "crimson", color: "#ef4444", title: "Crimson Peak" },
];

export default function BoundsMultiIndex() {
	const stackType = useResolvedStackType();
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title="Multi Boundary"
				subtitle="Two independent boundaries per transition"
			/>
			<ScrollView contentContainerStyle={styles.content}>
				{ITEMS.map((item) => (
					<Pressable
						key={item.id}
						style={styles.card}
						onPress={() => {
							router.push(buildStackPath(stackType, `bounds-multi/${item.id}`) as never);
						}}
					>
						<Transition.Boundary
							id={`multi-img-${item.id}`}
							style={[styles.thumbnail, { backgroundColor: item.color }]}
						/>
						<Transition.Boundary
							id={`multi-lbl-${item.id}`}
							style={styles.labelWrap}
						>
							<Text style={styles.title}>{item.title}</Text>
						</Transition.Boundary>
					</Pressable>
				))}
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#121212",
	},
	content: {
		padding: 16,
		gap: 12,
	},
	card: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		backgroundColor: "#1e1e1e",
		padding: 12,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#333",
	},
	thumbnail: {
		width: 56,
		height: 56,
		borderRadius: 12,
	},
	labelWrap: {
		flex: 1,
	},
	title: {
		fontSize: 16,
		fontWeight: "600",
		color: "#fff",
	},
});
