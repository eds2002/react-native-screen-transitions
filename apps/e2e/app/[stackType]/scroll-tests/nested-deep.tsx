import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

const CATEGORIES = [
	{ id: 1, title: "Category A", color: "#e74c3c" },
	{ id: 2, title: "Category B", color: "#3498db" },
	{ id: 3, title: "Category C", color: "#2ecc71" },
];

const SUBCATEGORIES = ["Sub 1", "Sub 2", "Sub 3", "Sub 4"];
const ITEMS_PER_SUB = 8;

export default function NestedDeepScreen() {
	const theme = useTheme();

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={["top"]}>
			<ScreenHeader
				title="Deeply Nested"
				subtitle="3 levels: vertical > horizontal > vertical"
			/>

			<Transition.ScrollView
				style={styles.outerScroll}
				contentContainerStyle={styles.outerContent}
			>
				{CATEGORIES.map((category) => (
					<View key={category.id} style={styles.category}>
						<Text style={[styles.categoryTitle, { color: theme.text }]}>{category.title}</Text>

						<Transition.ScrollView
							horizontal
							showsHorizontalScrollIndicator={false}
							contentContainerStyle={styles.horizontalContent}
						>
							{SUBCATEGORIES.map((sub, subIndex) => (
								<View key={subIndex.toString()} style={[styles.subcategory, { backgroundColor: theme.card }]}>
									<Text style={[styles.subcategoryTitle, { color: theme.textSecondary }]}>{sub}</Text>

									<Transition.ScrollView
										style={styles.innerScroll}
										contentContainerStyle={styles.innerContent}
										nestedScrollEnabled
									>
										{Array.from({ length: ITEMS_PER_SUB }, (_, i) => (
											<View
												key={i.toString()}
												style={[
													styles.item,
													{ backgroundColor: category.color },
												]}
											>
												<Text style={styles.itemText}>{i + 1}</Text>
											</View>
										))}
									</Transition.ScrollView>
								</View>
							))}
						</Transition.ScrollView>
					</View>
				))}

				<View style={styles.footer}>
					<Text style={[styles.footerText, { color: theme.textTertiary }]}>
						Tests ancestor scroll config propagation. Each nested ScrollView
						syncs its state up the tree.
					</Text>
				</View>
			</Transition.ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	outerScroll: {
		flex: 1,
	},
	outerContent: {
		paddingBottom: 20,
	},
	category: {
		marginBottom: 24,
	},
	categoryTitle: {
		fontSize: 20,
		fontWeight: "700",
		marginLeft: 16,
		marginBottom: 12,
	},
	horizontalContent: {
		paddingHorizontal: 16,
		gap: 12,
	},
	subcategory: {
		width: 160,
		borderRadius: 14,
		padding: 12,
	},
	subcategoryTitle: {
		fontSize: 14,
		fontWeight: "600",
		marginBottom: 8,
	},
	innerScroll: {
		height: 180,
	},
	innerContent: {
		gap: 6,
	},
	item: {
		height: 36,
		borderRadius: 6,
		justifyContent: "center",
		alignItems: "center",
	},
	itemText: {
		fontSize: 14,
		fontWeight: "600",
		color: "#fff",
	},
	footer: {
		padding: 16,
	},
	footerText: {
		fontSize: 13,
		lineHeight: 20,
	},
});
