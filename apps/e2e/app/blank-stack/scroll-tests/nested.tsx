import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";

const SECTIONS = [
	{ id: 1, title: "Featured", color: "#ff6b6b" },
	{ id: 2, title: "Popular", color: "#4ecdc4" },
	{ id: 3, title: "New Releases", color: "#45b7d1" },
	{ id: 4, title: "Trending", color: "#96ceb4" },
	{ id: 5, title: "For You", color: "#dda0dd" },
];

const CARDS_PER_SECTION = 10;

export default function NestedScrollScreen() {
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title="Nested ScrollViews"
				subtitle="Netflix-style: outer vertical, inner horizontal"
			/>

			<Transition.ScrollView
				style={styles.outerScroll}
				contentContainerStyle={styles.outerContent}
			>
				{SECTIONS.map((section) => (
					<View key={section.id} style={styles.section}>
						<Text style={styles.sectionTitle}>{section.title}</Text>
						<Transition.ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={styles.rowContent}
						>
							{Array.from({ length: CARDS_PER_SECTION }, (_, i) => (
								<View
									key={i.toString()}
									style={[styles.card, { backgroundColor: section.color }]}
								>
									<Text style={styles.cardText}>{i + 1}</Text>
								</View>
							))}
						</Transition.ScrollView>
					</View>
				))}
			</Transition.ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#141414",
	},
	outerScroll: {
		flex: 1,
	},
	outerContent: {
		paddingBottom: 20,
	},
	section: {
		marginBottom: 24,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: "#fff",
		marginLeft: 16,
		marginBottom: 12,
	},
	rowContent: {
		paddingHorizontal: 16,
		gap: 10,
	},
	card: {
		width: 120,
		height: 160,
		borderRadius: 8,
		justifyContent: "center",
		alignItems: "center",
	},
	cardText: {
		fontSize: 20,
		fontWeight: "bold",
		color: "#fff",
	},
});
