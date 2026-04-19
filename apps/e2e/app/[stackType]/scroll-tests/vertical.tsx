import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

const ITEMS = Array.from({ length: 30 }, (_, i) => ({
	id: i + 1,
	title: `Item ${i + 1}`,
}));

export default function VerticalScrollScreen() {
	const theme = useTheme();

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={["top"]}>
			<ScreenHeader
				title="Vertical Scroll"
				subtitle="Swipe down at scroll top to dismiss"
			/>

			<Transition.ScrollView
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
			>
				{ITEMS.map((item) => (
					<View key={item.id} style={[styles.item, { backgroundColor: theme.card }]}>
						<Text style={[styles.itemText, { color: theme.text }]}>{item.title}</Text>
					</View>
				))}
			</Transition.ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		padding: 16,
		gap: 8,
	},
	item: {
		padding: 16,
		borderRadius: 14,
	},
	itemText: {
		fontSize: 16,
	},
});
