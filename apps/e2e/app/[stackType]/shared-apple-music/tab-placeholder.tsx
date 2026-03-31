import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";

export function AppleMusicTabPlaceholder({
	tabLabel,
	body,
}: {
	tabLabel: string;
	body: string;
}) {
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				light
				title="Shared Apple Music"
				subtitle={`${tabLabel} tab in the restored deprecated preset demo`}
			/>

			<View style={styles.card}>
				<Text style={styles.eyebrow}>{tabLabel}</Text>
				<Text style={styles.title}>Original example parity</Text>
				<Text style={styles.body}>{body}</Text>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#FFF",
	},
	card: {
		margin: 16,
		borderRadius: 24,
		backgroundColor: "#F3F4F6",
		padding: 20,
		gap: 10,
	},
	eyebrow: {
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 1,
		textTransform: "uppercase",
		color: "#EF4444",
	},
	title: {
		fontSize: 22,
		fontWeight: "800",
		color: "#111827",
	},
	body: {
		fontSize: 15,
		lineHeight: 24,
		color: "#6B7280",
	},
});
