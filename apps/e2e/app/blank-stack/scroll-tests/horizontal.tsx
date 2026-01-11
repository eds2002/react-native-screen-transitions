import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";

const ITEMS = Array.from({ length: 20 }, (_, i) => ({
	id: i + 1,
	title: `Card ${i + 1}`,
}));

export default function HorizontalScrollScreen() {
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title="Horizontal Scroll"
				subtitle="Swipe right at scroll start to dismiss"
			/>

			<Transition.ScrollView
				horizontal
				style={styles.scrollView}
				contentContainerStyle={styles.scrollContent}
				showsHorizontalScrollIndicator={false}
			>
				{ITEMS.map((item) => (
					<View key={item.id} style={styles.card}>
						<Text style={styles.cardText}>{item.title}</Text>
					</View>
				))}
			</Transition.ScrollView>

			<View style={styles.infoSection}>
				<Text style={styles.infoText}>
					This screen has horizontal gesture dismiss. The horizontal ScrollView
					should only allow dismiss gestures when scrolled to the start (left
					edge).
				</Text>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#2e1a1a",
	},
	scrollView: {
		flexGrow: 0,
		marginVertical: 16,
	},
	scrollContent: {
		paddingHorizontal: 16,
		gap: 12,
	},
	card: {
		width: 140,
		height: 200,
		backgroundColor: "rgba(255,255,255,0.1)",
		borderRadius: 16,
		justifyContent: "center",
		alignItems: "center",
	},
	cardText: {
		fontSize: 16,
		fontWeight: "600",
		color: "#fff",
	},
	infoSection: {
		flex: 1,
		padding: 20,
	},
	infoText: {
		fontSize: 14,
		color: "rgba(255,255,255,0.5)",
		lineHeight: 22,
	},
});
