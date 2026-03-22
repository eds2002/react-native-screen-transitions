import { StyleSheet, Text, View } from "react-native";
import { GestureInfo } from "@/components/gesture-info";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

/**
 * Level 3: Vertical sheet with snap points [0.5, 0.8].
 *
 * This is the most complex scenario:
 * - Sheet shadows L1's vertical (both ↓ and ↑)
 * - Sheet inherits L2's horizontal (→)
 *
 * Test:
 *   - ↓ collapses/dismisses sheet (shadows L1)
 *   - ↑ expands sheet
 *   - → dismisses L2 stack (inherited from deeper)
 *   - ← nothing
 */
export default function SheetScreen() {
	const theme = useTheme();

	return (
		<View style={styles.container}>
			<View
				style={[styles.sheet, { backgroundColor: theme.card }]}
			>
				<View style={[styles.handle, { backgroundColor: theme.handle }]} />
				<ScreenHeader
					title="L3: Sheet (snap points)"
					subtitle="Shadows L1 vertical, inherits L2 horizontal"
				/>

				<View style={styles.content}>
					<GestureInfo
						title="Final position in 3-level hierarchy"
						structure={`snap-deep-nesting/  (vertical)    ← L1 (SHADOWED)
  └─ deeper/          (horizontal)   ← L2 (inherited)
       └─ sheet       (snap, vert)   ← YOU ARE HERE`}
						behaviors={[
							{
								direction: "down",
								owner: "Sheet (L3)",
								result: "Dismiss sheet (back to deeper/index)",
							},
							{
								direction: "up",
								owner: "Sheet (L3)",
								result: "Expand to 0.8",
							},
							{
								direction: "right",
								owner: "deeper (L2)",
								result: "Dismiss L2 stack (back to snap-deep-nesting/index)",
							},
							{ direction: "left", owner: null, result: "Nothing" },
						]}
						note="This is the ultimate test! Sheet owns ↓↑ (shadows L1), inherits → from L2."
					/>

					<View
						style={[styles.keyPoint, { backgroundColor: theme.noteBox }]}
					>
						<Text
							style={[styles.keyPointTitle, { color: theme.noteText }]}
						>
							Why This Works
						</Text>
						<Text
							style={[
								styles.keyPointText,
								{ color: theme.textSecondary },
							]}
						>
							1. Sheet has snap points → claims vertical AND vertical-inverted
							{"\n"}
							2. This shadows L1's vertical (L1 is blocked){"\n"}
							3. But horizontal is free → inherits from L2{"\n"}
							4. Result: ↓↑ control sheet, → dismisses L2 stack
						</Text>
					</View>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "flex-end",
	},
	sheet: {
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		paddingTop: 12,
		paddingBottom: 40,
		flex: 1,
	},
	handle: {
		width: 40,
		height: 4,
		borderRadius: 2,
		alignSelf: "center",
		marginBottom: 8,
	},
	content: {
		flex: 1,
		gap: 16,
	},
	keyPoint: {
		margin: 16,
		borderRadius: 14,
		padding: 16,
	},
	keyPointTitle: {
		fontSize: 14,
		fontWeight: "600",
		marginBottom: 8,
	},
	keyPointText: {
		fontSize: 13,
		lineHeight: 22,
	},
});
