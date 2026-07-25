import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Transition from "react-native-screen-transitions";
import { useTheme } from "@/theme";
import { SHEET_ZOOM_BOUNDARY_ID } from "./constants";

export default function ExampleSheet() {
	const theme = useTheme();

	return (
		<View style={[styles.container, { backgroundColor: theme.card }]}>
			<View style={[styles.grabber, { backgroundColor: theme.textTertiary }]} />
			<Text style={[styles.eyebrow, { color: theme.textTertiary }]}>
				SNAP POINT 0.5
			</Text>
			<Text style={[styles.title, { color: theme.text }]}>
				The sheet owns translateY
			</Text>
			<Text style={[styles.description, { color: theme.textSecondary }]}>
				Push the full-screen route below, then return. The sheet should still
				occupy exactly the lower half of the screen.
			</Text>

			<Transition.Boundary
				id={SHEET_ZOOM_BOUNDARY_ID}
				style={styles.zoomSource}
				onPress={() => router.push("/example/zoom")}
			>
				<View style={styles.artwork}>
					<View style={styles.orbit} />
					<View style={styles.planet} />
				</View>
				<View style={styles.zoomCopy}>
					<Text style={styles.zoomTitle}>Push navigation.zoom()</Text>
					<Text style={styles.zoomSubtitle}>Full-screen destination</Text>
				</View>
				<Text style={styles.arrow}>→</Text>
			</Transition.Boundary>

			<Pressable
				testID="style-reset-close-sheet"
				style={styles.closeButton}
				onPress={router.back}
			>
				<Text style={[styles.closeText, { color: theme.textSecondary }]}>
					Close sheet
				</Text>
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 20,
		paddingTop: 10,
	},
	grabber: {
		alignSelf: "center",
		borderRadius: 3,
		height: 5,
		opacity: 0.45,
		width: 44,
	},
	eyebrow: {
		fontSize: 11,
		fontWeight: "800",
		letterSpacing: 1.1,
		marginTop: 22,
	},
	title: {
		fontSize: 25,
		fontWeight: "800",
		letterSpacing: -0.5,
		marginTop: 6,
	},
	description: {
		fontSize: 14,
		lineHeight: 20,
		marginTop: 8,
	},
	zoomSource: {
		alignItems: "center",
		backgroundColor: "#5B5CE2",
		borderRadius: 20,
		flexDirection: "row",
		marginTop: 20,
		padding: 14,
	},
	artwork: {
		alignItems: "center",
		backgroundColor: "#17172D",
		borderRadius: 14,
		height: 58,
		justifyContent: "center",
		overflow: "hidden",
		width: 58,
	},
	orbit: {
		borderColor: "#A5A6FF",
		borderRadius: 25,
		borderWidth: 1,
		height: 28,
		position: "absolute",
		transform: [{ rotate: "-24deg" }],
		width: 50,
	},
	planet: {
		backgroundColor: "#FFB45B",
		borderRadius: 10,
		height: 20,
		width: 20,
	},
	zoomCopy: {
		flex: 1,
		marginLeft: 14,
	},
	zoomTitle: {
		color: "white",
		fontSize: 15,
		fontWeight: "800",
	},
	zoomSubtitle: {
		color: "rgba(255,255,255,0.68)",
		fontSize: 12,
		marginTop: 3,
	},
	arrow: {
		color: "white",
		fontSize: 22,
		fontWeight: "700",
	},
	closeButton: {
		alignItems: "center",
		padding: 16,
	},
	closeText: {
		fontSize: 14,
		fontWeight: "700",
	},
});
