import { StyleSheet, Text, View } from "react-native";
import Transition from "react-native-screen-transitions";

import { ScreenHeader } from "@/components/screen-header";

const ITEMS = Array.from({ length: 30 }, (_, i) => ({
	id: i + 1,
	title: `Item ${i + 1}`,
	description: `This is the description for item ${i + 1}`,
}));

export default function WithScrollInvertedScreen() {
	return (
		<View style={styles.container}>
			<View style={styles.sheet}>
				<ScreenHeader
					title="Top Sheet with Scroll"
					subtitle="Scroll to see items. Pull up at top to dismiss."
				/>

				<Transition.ScrollView style={styles.scrollView}>
					{ITEMS.map((item) => (
						<View key={item.id} style={styles.item}>
							<Text style={styles.itemTitle}>{item.title}</Text>
							<Text style={styles.itemDescription}>{item.description}</Text>
						</View>
					))}
				</Transition.ScrollView>

				<View style={styles.handle} />
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "flex-start",
	},
	sheet: {
		backgroundColor: "#2e1a1a",
		borderBottomLeftRadius: 24,
		borderBottomRightRadius: 24,
		paddingTop: 60,
		paddingBottom: 12,
		flex: 1,
	},
	handle: {
		width: 40,
		height: 4,
		backgroundColor: "rgba(255,255,255,0.3)",
		borderRadius: 2,
		alignSelf: "center",
		marginTop: 16,
	},
	scrollView: {
		flex: 1,
		marginHorizontal: 16,
	},
	item: {
		backgroundColor: "rgba(255,255,255,0.1)",
		padding: 16,
		borderRadius: 12,
		marginBottom: 8,
	},
	itemTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: "#fff",
		marginBottom: 4,
	},
	itemDescription: {
		fontSize: 13,
		color: "rgba(255,255,255,0.6)",
	},
});
