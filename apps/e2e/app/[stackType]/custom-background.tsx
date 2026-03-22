import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { useTheme } from "@/theme";

export default function CustomBackgroundScreen() {
	const stackType = useResolvedStackType();
	const theme = useTheme();
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title="Custom Surface"
				subtitle="Squircle surface component with animated content transform."
			/>
			<View style={styles.content}>
				<View style={[styles.card, { backgroundColor: theme.card }]}>
					<Text style={[styles.cardTitle, { color: theme.text }]}>Surface Slot</Text>
					<Text style={[styles.cardBody, { color: theme.textSecondary }]}>
						This route renders `surfaceComponent` and drives styles/props via
						the `surface` slot while screen motion stays in `content`.
					</Text>
				</View>
				<Pressable
					testID="push-detail-from-custom-background"
					style={({ pressed }) => [
						styles.button,
						{ backgroundColor: pressed ? theme.actionButtonPressed : theme.actionButton },
					]}
					onPress={() => router.push(buildStackPath(stackType, "detail"))}
				>
					<Text style={[styles.buttonText, { color: theme.actionButtonText }]}>
						Push Detail Screen
					</Text>
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
		borderRadius: 16,
		padding: 18,
	},
	cardTitle: {
		fontSize: 18,
		fontWeight: "700",
		marginBottom: 8,
	},
	cardBody: {
		fontSize: 14,
		lineHeight: 21,
	},
	button: {
		paddingVertical: 16,
		paddingHorizontal: 24,
		borderRadius: 999,
		alignItems: "center",
	},
	buttonText: {
		fontSize: 16,
		fontWeight: "700",
	},
});
