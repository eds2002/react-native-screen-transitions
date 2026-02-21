import { router, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";
import { buildStackPath, useResolvedStackType } from "@/components/stack-examples/stack-routing";

export default function BlankStackDeepLink() {
	const stackType = useResolvedStackType();
	const stackLabel = stackType === "native-stack" ? "Native Stack" : "Blank Stack";
	const { id } = useLocalSearchParams<{ id: string }>();

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader title={`${stackLabel} Deep Link`} subtitle={`id: ${id}`} />
			<View style={styles.content}>
				<Text style={styles.label}>Stack Type</Text>
				<Text style={styles.value}>{stackLabel}</Text>

				<Text style={styles.label}>Route ID</Text>
				<Text style={styles.value}>{id}</Text>

				<View style={styles.buttons}>
					<Pressable
						testID="deep-link-back"
						style={styles.button}
						onPress={() => router.back()}
					>
						<Text style={styles.buttonText}>Back</Text>
					</Pressable>
					<Pressable
						testID="deep-link-push"
						style={styles.button}
						onPress={() =>
							router.push(buildStackPath(stackType, "deep-link/beta") as never)
						}
					>
						<Text style={styles.buttonText}>Push "beta"</Text>
					</Pressable>
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#121212",
	},
	content: {
		padding: 24,
		gap: 12,
	},
	label: {
		fontSize: 12,
		fontWeight: "600",
		color: "#888",
		textTransform: "uppercase",
	},
	value: {
		fontSize: 18,
		fontWeight: "600",
		color: "#fff",
		marginBottom: 8,
	},
	buttons: {
		flexDirection: "row",
		gap: 12,
		marginTop: 12,
	},
	button: {
		backgroundColor: "#333",
		paddingHorizontal: 20,
		paddingVertical: 12,
		borderRadius: 8,
	},
	buttonText: {
		color: "#fff",
		fontWeight: "600",
	},
});
