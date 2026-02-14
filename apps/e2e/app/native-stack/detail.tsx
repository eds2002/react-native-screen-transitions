import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/screen-header";

export default function DetailScreen() {
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title="Detail Screen"
				subtitle="This is a nested detail screen. Test the back gesture or button."
			/>
			<View style={styles.content}>
				<Pressable
					testID="push-another"
					style={styles.button}
					onPress={() => router.push("/native-stack/detail")}
				>
					<Text style={styles.buttonText}>Push Another Detail</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#1a3347",
	},
	content: {
		flex: 1,
		padding: 20,
		justifyContent: "center",
		alignItems: "center",
	},
	button: {
		backgroundColor: "rgba(255,255,255,0.2)",
		paddingVertical: 16,
		paddingHorizontal: 32,
		borderRadius: 12,
		marginBottom: 12,
		minWidth: 200,
		alignItems: "center",
	},
	buttonText: {
		fontSize: 16,
		fontWeight: "600",
		color: "#fff",
	},
});
