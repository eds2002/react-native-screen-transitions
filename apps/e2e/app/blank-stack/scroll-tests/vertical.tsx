import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";

const ITEMS = Array.from({ length: 30 }, (_, i) => ({
	id: i + 1,
	title: `Item ${i + 1}`,
}));

export default function VerticalScrollScreen() {
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title="Vertical Scroll"
				subtitle="Swipe down at scroll top to dismiss"
			/>

			<Transition.ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
			>
				{ITEMS.map((item) => (
					<View key={item.id} style={styles.item}>
						<Text style={styles.itemText}>{item.title}</Text>
					</View>
				))}
			</Transition.ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#1a1a2e",
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		padding: 16,
		gap: 8,
	},
	item: {
		backgroundColor: "rgba(255,255,255,0.1)",
		padding: 16,
		borderRadius: 12,
	},
	itemText: {
		fontSize: 16,
		color: "#fff",
	},
});
