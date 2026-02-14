import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/screen-header";

export default function SlideVerticalScreen() {
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title="Slide from Bottom"
				subtitle="Swipe down from the top to dismiss, or tap the button below."
			/>
			<View style={styles.content}>
				<Pressable
					testID="push-detail"
					style={styles.button}
					onPress={() => router.push("/blank-stack/detail")}
				>
					<Text style={styles.buttonText}>Push Another Screen</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#2a1a47",
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
