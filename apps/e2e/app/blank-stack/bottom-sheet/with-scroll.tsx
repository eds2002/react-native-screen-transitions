import { StyleSheet, Text, View } from "react-native";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";

const ITEMS = Array.from({ length: 30 }, (_, i) => ({
	id: i + 1,
	title: `Item ${i + 1}`,
	description: `This is the description for item ${i + 1}`,
}));

export default function WithScrollScreen() {
	return (
		<View style={styles.container}>
			<View style={styles.sheet}>
				<View style={styles.handle} />
				<ScreenHeader
					title="Scrollable Sheet"
					subtitle="Scroll to see items. Pull down at top to dismiss."
				/>

				<Transition.ScrollView style={styles.scrollView}>
					{ITEMS.map((item) => (
						<View key={item.id} style={styles.item}>
							<Text style={styles.itemTitle}>{item.title}</Text>
							<Text style={styles.itemDescription}>{item.description}</Text>
						</View>
					))}
				</Transition.ScrollView>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "flex-end",
	},
	sheet: {
		backgroundColor: "#1a1a2e",
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		paddingTop: 12,
		paddingBottom: 20,
		flex: 1,
	},
	handle: {
		width: 40,
		height: 4,
		backgroundColor: "rgba(255,255,255,0.3)",
		borderRadius: 2,
		alignSelf: "center",
		marginBottom: 16,
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
