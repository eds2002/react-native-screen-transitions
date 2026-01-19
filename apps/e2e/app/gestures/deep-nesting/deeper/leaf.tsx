import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureInfo } from "@/components/gesture-info";
import { ScreenHeader } from "@/components/screen-header";

/**
 * Level 3: Leaf with vertical gesture
 *
 * This shadows Level 1's vertical gesture, but inherits Level 2's horizontal.
 *
 * Expected:
 * - ↓ dismisses only this leaf (shadows L1 vertical)
 * - → dismisses the deeper stack (inherited from L2 horizontal)
 */
export default function LeafScreen() {
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title="Level 3: Leaf (vertical)"
				subtitle="Shadows L1, inherits horizontal from L2"
			/>

			<View style={styles.content}>
				<GestureInfo
					title="Final position in 3-level hierarchy"
					structure={`gestures/deep-nesting/     (vertical)   ← L1 (SHADOWED)
  └─ deeper/                  (horizontal)  ← L2 (inherited)
       └─ leaf                (vertical)    ← YOU ARE HERE`}
					behaviors={[
						{
							direction: "down",
							owner: "leaf (L3)",
							result: "Dismisses ONLY this leaf (back to deeper/index)",
						},
						{
							direction: "right",
							owner: "deeper (L2)",
							result: "Dismisses L2 stack (back to deep-nesting/index)",
						},
						{ direction: "up", owner: null, result: "Nothing" },
						{ direction: "left", owner: null, result: "Nothing" },
					]}
					note="↓ is SHADOWED: L3 claims vertical, so L1's vertical is blocked. But → works: inherited from L2."
				/>

				<View style={styles.keyPoint}>
					<Text style={styles.keyPointTitle}>Key Insight</Text>
					<Text style={styles.keyPointText}>
						This leaf shadows the vertical gesture from Level 1 (deep-nesting).
						But it still inherits the horizontal gesture from Level 2 (deeper).
						Shadowing only affects the same direction!
					</Text>
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#1b4e3a",
	},
	content: {
		flex: 1,
		gap: 16,
	},
	keyPoint: {
		margin: 16,
		backgroundColor: "rgba(74, 255, 158, 0.1)",
		borderRadius: 12,
		padding: 16,
		borderWidth: 1,
		borderColor: "rgba(74, 255, 158, 0.3)",
	},
	keyPointTitle: {
		fontSize: 14,
		fontWeight: "600",
		color: "#4aff9e",
		marginBottom: 8,
	},
	keyPointText: {
		fontSize: 13,
		color: "rgba(255, 255, 255, 0.8)",
		lineHeight: 20,
	},
});
