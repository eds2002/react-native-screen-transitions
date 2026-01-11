import { Alert, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "@/components/button";
import { FloatingOverlay } from "@/components/component-stack/floating-overlay";

export default function ComponentStackDemo() {
	return (
		<View style={styles.container}>
			{/* Background content */}
			<SafeAreaView style={styles.background}>
				<Text style={styles.title}>Component Stack Demo</Text>
				<Text style={styles.subtitle}>
					The floating overlay below uses ComponentStack
				</Text>
				<Text style={styles.subtitle}>
					(independent of Expo Router - URL doesn&apos;t change)
				</Text>
				<Button onPress={() => Alert.alert("HI")}>Touch through test</Button>
			</SafeAreaView>

			<FloatingOverlay />
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#121212",
	},
	background: {
		flex: 1,
		padding: 20,
		justifyContent: "center",
		alignItems: "center",
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#fff",
		marginBottom: 12,
		textAlign: "center",
	},
	subtitle: {
		fontSize: 14,
		color: "#666",
		textAlign: "center",
		marginBottom: 4,
	},
});
