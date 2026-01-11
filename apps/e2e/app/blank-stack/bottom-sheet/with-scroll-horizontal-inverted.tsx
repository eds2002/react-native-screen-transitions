import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Transition from "react-native-screen-transitions";

const ITEMS = Array.from({ length: 20 }, (_, i) => ({
	id: i + 1,
	title: `Card ${i + 1}`,
}));

export default function WithScrollHorizontalInvertedScreen() {
	return (
		<View style={styles.container}>
			<View style={styles.sheet}>
				<View style={styles.handle} />
				<Text style={styles.title}>Left Drawer</Text>
				<Text style={styles.subtitle}>
					Scroll horizontally. Swipe left at start to dismiss.
				</Text>

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

				<Pressable
					testID="go-back"
					style={styles.button}
					onPress={() => router.back()}
				>
					<Text style={styles.buttonText}>Close</Text>
				</Pressable>
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
		backgroundColor: "#2e2e1a",
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
	title: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#fff",
		textAlign: "center",
		marginBottom: 4,
	},
	subtitle: {
		fontSize: 14,
		color: "rgba(255,255,255,0.6)",
		textAlign: "center",
		marginBottom: 16,
		paddingHorizontal: 20,
	},
	scrollView: {
		flexGrow: 0,
		marginBottom: 16,
	},
	scrollContent: {
		paddingHorizontal: 16,
		gap: 12,
	},
	card: {
		width: 120,
		height: 160,
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
	button: {
		backgroundColor: "rgba(255,255,255,0.2)",
		paddingVertical: 16,
		paddingHorizontal: 32,
		borderRadius: 12,
		marginHorizontal: 20,
		alignItems: "center",
	},
	buttonText: {
		fontSize: 16,
		fontWeight: "600",
		color: "#fff",
	},
});
