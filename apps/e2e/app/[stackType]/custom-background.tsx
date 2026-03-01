import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";

export default function CustomBackgroundScreen() {
	const stackType = useResolvedStackType();
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title="Custom Surface"
				subtitle="Squircle surface component with animated content transform."
			/>
			<View style={styles.content}>
				<View style={styles.card}>
					<Text style={styles.cardTitle}>Surface Slot</Text>
					<Text style={styles.cardBody}>
						This route renders `surfaceComponent` and drives styles/props via
						the `surface` slot while screen motion stays in `content`.
					</Text>
				</View>
				<Pressable
					testID="push-detail-from-custom-background"
					style={styles.button}
					onPress={() => router.push(buildStackPath(stackType, "detail"))}
				>
					<Text style={styles.buttonText}>Push Detail Screen</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "transparent",
	},
	content: {
		flex: 1,
		padding: 20,
		gap: 12,
		justifyContent: "center",
	},
	card: {
		backgroundColor: "rgba(255,255,255,0.08)",
		borderRadius: 16,
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.18)",
		padding: 18,
	},
	cardTitle: {
		color: "#fff",
		fontSize: 18,
		fontWeight: "700",
		marginBottom: 8,
	},
	cardBody: {
		color: "#d6deee",
		fontSize: 14,
		lineHeight: 21,
	},
	button: {
		backgroundColor: "rgba(255,255,255,0.18)",
		paddingVertical: 16,
		paddingHorizontal: 24,
		borderRadius: 12,
		alignItems: "center",
	},
	buttonText: {
		fontSize: 16,
		fontWeight: "700",
		color: "#fff",
	},
});
