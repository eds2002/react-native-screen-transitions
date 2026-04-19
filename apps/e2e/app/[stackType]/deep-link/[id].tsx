import { router, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";
import { buildStackPath, useResolvedStackType } from "@/components/stack-examples/stack-routing";
import { useTheme } from "@/theme";

export default function BlankStackDeepLink() {
	const stackType = useResolvedStackType();
	const stackLabel = stackType === "native-stack" ? "Native Stack" : "Blank Stack";
	const { id } = useLocalSearchParams<{ id: string }>();
	const theme = useTheme();

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={["top"]}>
			<ScreenHeader title={`${stackLabel} Deep Link`} subtitle={`id: ${id}`} />
			<View style={styles.content}>
				<Text style={[styles.label, { color: theme.textTertiary }]}>Stack Type</Text>
				<Text style={[styles.value, { color: theme.text }]}>{stackLabel}</Text>

				<Text style={[styles.label, { color: theme.textTertiary }]}>Route ID</Text>
				<Text style={[styles.value, { color: theme.text }]}>{id}</Text>

				<View style={styles.buttons}>
					<Pressable
						testID="deep-link-back"
						style={({ pressed }) => [styles.button, { backgroundColor: pressed ? theme.secondaryButtonPressed : theme.secondaryButton }]}
						onPress={() => router.back()}
					>
						<Text style={[styles.buttonText, { color: theme.secondaryButtonText }]}>Back</Text>
					</Pressable>
					<Pressable
						testID="deep-link-push"
						style={({ pressed }) => [styles.button, { backgroundColor: pressed ? theme.secondaryButtonPressed : theme.secondaryButton }]}
						onPress={() =>
							router.push(buildStackPath(stackType, "deep-link/beta") as never)
						}
					>
						<Text style={[styles.buttonText, { color: theme.secondaryButtonText }]}>Push "beta"</Text>
					</Pressable>
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		padding: 24,
		gap: 12,
	},
	label: {
		fontSize: 12,
		fontWeight: "600",
		textTransform: "uppercase",
	},
	value: {
		fontSize: 18,
		fontWeight: "600",
		marginBottom: 8,
	},
	buttons: {
		flexDirection: "row",
		gap: 12,
		marginTop: 12,
	},
	button: {
		paddingHorizontal: 20,
		paddingVertical: 12,
		borderRadius: 999,
	},
	buttonText: {
		fontWeight: "600",
	},
});
