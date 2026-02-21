import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";

const ITEMS = [
	{ id: "alpine", color: "#4f7cff", title: "Alpine Vista" },
	{ id: "desert", color: "#ff6b35", title: "Desert Sunset" },
	{ id: "ocean", color: "#18a999", title: "Ocean Depth" },
	{ id: "golden", color: "#f4b400", title: "Golden Hour" },
	{ id: "twilight", color: "#8b5cf6", title: "Twilight" },
	{ id: "crimson", color: "#ef4444", title: "Crimson Peak" },
];

export default function BoundsMultiDetail() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const { width } = useWindowDimensions();
	const item = ITEMS.find((i) => i.id === id);
	const imageWidth = width - 32;

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader title="Multi Detail" subtitle={id} />
			<View style={styles.content}>
				<Transition.Boundary
					id={`multi-img-${id}`}
					style={[
						styles.image,
						{
							width: imageWidth,
							height: imageWidth * 0.6,
							backgroundColor: item?.color ?? "#333",
						},
					]}
				/>
				<Transition.Boundary id={`multi-lbl-${id}`} style={styles.labelWrap}>
					<Text style={styles.title}>{item?.title ?? "Unknown"}</Text>
				</Transition.Boundary>
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
		gap: 16,
		padding: 16,
	},
	image: {
		borderRadius: 20,
	},
	labelWrap: {
		alignItems: "center",
	},
	title: {
		fontSize: 28,
		fontWeight: "700",
		color: "#fff",
	},
});
