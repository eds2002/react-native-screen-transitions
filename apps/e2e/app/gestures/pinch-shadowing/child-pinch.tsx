import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

export default function PinchShadowingChildPinch() {
	const theme = useTheme();

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.bg }]}
			edges={["top"]}
		>
			<ScreenHeader
				title="Child Pinch Leaf"
				subtitle="Same pinch directions as parent"
			/>

			<View style={styles.content}>
				<View style={[styles.box, { backgroundColor: theme.infoBox }]}>
					<Text style={[styles.title, { color: theme.text }]}>
						What to test
					</Text>
					<Text style={[styles.body, { color: theme.textSecondary }]}>
						Pinch inward or outward. If the child pinch wins, you should dismiss
						only this leaf and land back on the pinch probe index. If you leave
						the probe entirely, the parent pinch won instead.
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
