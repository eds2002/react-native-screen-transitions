import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useScreenState } from "react-native-screen-transitions";

import { ScreenHeader } from "@/components/screen-header";

const SNAP_POINTS = [
	{ index: 0, label: "20%" },
	{ index: 1, label: "40%" },
	{ index: 2, label: "60%" },
	{ index: 3, label: "80%" },
	{ index: 4, label: "100%" },
];

export default function MultiSnapScreen() {
	const { snapTo } = useScreenState();

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<View style={styles.content}>
				<View style={styles.handle} />
				<ScreenHeader
					title="Multi Snap"
					subtitle="Tap a button to programmatically snap to that point, or drag to snap manually."
				/>

				<View style={styles.indicators}>
					{SNAP_POINTS.map(({ index, label }) => (
						<Pressable
							key={index}
							testID={`snap-to-${index}`}
							style={styles.indicator}
							onPress={() => snapTo(index)}
						>
							<Text style={styles.indicatorText}>{label}</Text>
						</Pressable>
					))}
				</View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#1a2e1a",
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16,
	},
	content: {
		flex: 1,
		padding: 20,
		alignItems: "center",
	},
	handle: {
		width: 40,
		height: 4,
		backgroundColor: "rgba(255,255,255,0.3)",
		borderRadius: 2,
		marginBottom: 20,
	},
	indicators: {
		flexDirection: "row",
		gap: 8,
		marginBottom: 40,
	},
	indicator: {
		backgroundColor: "rgba(255,255,255,0.15)",
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 8,
	},
	indicatorText: {
		fontSize: 12,
		fontWeight: "600",
		color: "rgba(255,255,255,0.7)",
	},
});
