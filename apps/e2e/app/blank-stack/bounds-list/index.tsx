import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";

const ITEMS = Array.from({ length: 30 }, (_, i) => ({
	id: `list-${i}`,
	label: `Item ${i + 1}`,
	color: `hsl(${i * 12}, 70%, 50%)`,
}));

export default function BoundsListIndex() {
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title="Bounds List"
				subtitle="Scroll then tap — tests measurement at scroll offset"
			/>
			<Transition.ScrollView contentContainerStyle={styles.list}>
				{ITEMS.map((item) => (
					<Pressable
						key={item.id}
						style={styles.row}
						onPress={() => {
							router.push(`/blank-stack/bounds-list/${item.id}` as never);
						}}
					>
						<Transition.Boundary
							id={item.id}
							style={[styles.avatar, { backgroundColor: item.color }]}
						>
							<Text style={styles.avatarText}>{item.label.split(" ")[1]}</Text>
						</Transition.Boundary>
						<Text style={styles.rowLabel}>{item.label}</Text>
					</Pressable>
				))}
			</Transition.ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#121212",
	},
	list: {
		padding: 16,
		gap: 8,
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		backgroundColor: "#1e1e1e",
		padding: 12,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#333",
	},
	avatar: {
		width: 48,
		height: 48,
		borderRadius: 24,
		alignItems: "center",
		justifyContent: "center",
	},
	avatarText: {
		color: "#fff",
		fontWeight: "700",
		fontSize: 16,
	},
	rowLabel: {
		fontSize: 16,
		fontWeight: "500",
		color: "#fff",
	},
});
