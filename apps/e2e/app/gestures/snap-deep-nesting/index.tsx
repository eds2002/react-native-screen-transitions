import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureInfo } from "@/components/gesture-info";
import { ScreenHeader } from "@/components/screen-header";

export default function SnapDeepNestingIndex() {
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title="9. Deep Nesting with Snap Points"
				subtitle="3 levels: vertical > horizontal > sheet"
			/>

			<ScrollView contentContainerStyle={styles.scrollContent}>
				<GestureInfo
					title="Complex scenario: Snap sheet in nested stacks"
					structure={`gestures/snap-deep-nesting/  (vertical)    ← L1
  └─ deeper/                   (horizontal)   ← L2
       └─ sheet (snapPoints, vertical)        ← L3`}
					behaviors={[
						{
							direction: "down",
							owner: "This stack (L1)",
							result: "Dismisses entire L1 stack",
						},
					]}
					note="Navigate to deeper/ to see the full 3-level hierarchy with snap points."
				/>

				<View style={styles.conceptBox}>
					<Text style={styles.conceptTitle}>What Makes This Complex</Text>
					<Text style={styles.conceptText}>
						L1 has vertical, L2 has horizontal, L3 (sheet) has vertical snap
						points.{"\n\n"}
						On the sheet:{"\n"}• ↓ ↑ are owned by sheet (shadows L1){"\n"}• → is
						inherited from L2{"\n"}• ← nothing
					</Text>
				</View>

				<View style={styles.actions}>
					<Pressable
						style={styles.button}
						onPress={() => router.push("/gestures/snap-deep-nesting/deeper")}
					>
						<Text style={styles.buttonText}>Go Deeper (L2)</Text>
						<Text style={styles.buttonSubtext}>
							Horizontal stack with sheet
						</Text>
					</Pressable>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#1a1a2e",
	},
	scrollContent: {
		paddingBottom: 40,
	},
	conceptBox: {
		margin: 16,
		backgroundColor: "rgba(255, 158, 255, 0.1)",
		borderRadius: 12,
		padding: 16,
		borderWidth: 1,
		borderColor: "rgba(255, 158, 255, 0.3)",
	},
	conceptTitle: {
		fontSize: 14,
		fontWeight: "600",
		color: "#ff9eff",
		marginBottom: 8,
	},
	conceptText: {
		fontSize: 13,
		color: "rgba(255, 255, 255, 0.8)",
		lineHeight: 20,
	},
	actions: {
		padding: 16,
		gap: 12,
	},
	button: {
		backgroundColor: "#ff9eff",
		padding: 16,
		borderRadius: 12,
		alignItems: "center",
	},
	buttonText: {
		color: "#000",
		fontSize: 16,
		fontWeight: "600",
	},
	buttonSubtext: {
		color: "rgba(0, 0, 0, 0.6)",
		fontSize: 12,
		marginTop: 4,
	},
});
