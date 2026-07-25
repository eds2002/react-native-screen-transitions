import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";
import { REVEAL_TRANSFORMED_SOURCE_ID } from "./constants";

export default function RevealTransformedSourceDestination() {
	const theme = useTheme();
	return (
		<SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
			<ScreenHeader
				title="Reveal destination"
				subtitle="The mask should originate at the visible compressed source card."
			/>
			<View style={styles.content}>
				<Transition.Boundary.View
					id={REVEAL_TRANSFORMED_SOURCE_ID}
					style={[styles.target, { backgroundColor: theme.actionButton }]}
				>
					<Text style={[styles.targetText, { color: theme.actionButtonText }]}>
						Reveal target
					</Text>
				</Transition.Boundary.View>
				<Pressable
					style={[styles.backButton, { backgroundColor: theme.card }]}
					onPress={() => router.back()}
				>
					<Text style={{ color: theme.text }}>Back</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	content: { flex: 1, gap: 18, padding: 16 },
	target: { alignItems: "center", borderRadius: 28, flex: 1, justifyContent: "center" },
	targetText: { fontSize: 28, fontWeight: "800" },
	backButton: { alignItems: "center", borderRadius: 12, padding: 14 },
});
