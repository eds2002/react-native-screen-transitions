import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/screen-header";
import { buildStackPath, useResolvedStackType } from "@/components/stack-examples/stack-routing";

export default function SlideHorizontalScreen() {
	const stackType = useResolvedStackType();
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title="Slide from Right"
				subtitle="Swipe from the left edge to go back, or tap the button below."
			/>
			<View style={styles.content}>
				<Pressable
					testID="push-detail"
					style={styles.button}
					onPress={() => router.push(buildStackPath(stackType, "detail"))}
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
		backgroundColor: "#1a472a",
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
