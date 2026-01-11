import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useScreenState } from "react-native-screen-transitions";

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
		<SafeAreaView style={styles.container}>
			<View style={styles.content}>
				<View style={styles.handle} />
				<Text style={styles.title}>Multi Snap</Text>
				<Text style={styles.description}>
					Tap a button to programmatically snap to that point, or drag to snap
					manually.
				</Text>

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

				<Pressable
					testID="go-back"
					style={styles.button}
					onPress={() => router.back()}
				>
					<Text style={styles.buttonText}>Close</Text>
				</Pressable>
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
	title: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#fff",
		marginBottom: 12,
	},
	description: {
		fontSize: 16,
		color: "rgba(255,255,255,0.7)",
		textAlign: "center",
		marginBottom: 24,
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
	button: {
		backgroundColor: "rgba(255,255,255,0.2)",
		paddingVertical: 16,
		paddingHorizontal: 32,
		borderRadius: 12,
		minWidth: 200,
		alignItems: "center",
	},
	buttonText: {
		fontSize: 16,
		fontWeight: "600",
		color: "#fff",
	},
});
