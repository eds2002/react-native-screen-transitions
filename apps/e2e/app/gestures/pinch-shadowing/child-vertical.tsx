import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

export default function PinchShadowingChildVertical() {
	const theme = useTheme();

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.bg }]}
			edges={["top"]}
		>
			<ScreenHeader
				title="Child Vertical Leaf"
				subtitle="Vertical child with parent pinch"
			/>

			<View style={styles.content}>
				<View style={[styles.box, { backgroundColor: theme.infoBox }]}>
					<Text style={[styles.title, { color: theme.text }]}>
						What to test
					</Text>
					<Text style={[styles.body, { color: theme.textSecondary }]}>
						Swipe down to confirm the child vertical gesture dismisses only this
						leaf. Then reopen it and pinch inward or outward to see whether the
						parent pinch still owns pinch when the child uses a different
						gesture family.
					</Text>
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	content: { flex: 1, padding: 16 },
	box: { borderRadius: 14, padding: 16 },
	title: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
	body: { fontSize: 14, lineHeight: 20 },
});
