import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import Transition from "react-native-screen-transitions";
import { useTheme } from "@/theme";

export default function MatchedScreenDebugIndex() {
	const theme = useTheme();

	return (
		<View style={[styles.screen, { backgroundColor: theme.bg }]}>
			<Text style={[styles.label, { color: theme.text }]}>
				Hello whats going on
			</Text>
			<View style={styles.sourceFrame}>
				<Transition.Boundary.Trigger
					id="video"
					testID="matched-screen-debug-trigger"
					portal={{ attachTo: "matched-screen" }}
					onPress={() => router.push("/matched-screen-debug/player")}
				>
					<Transition.Boundary.Target style={styles.sourceVideo} />
				</Transition.Boundary.Trigger>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	label: {
		fontSize: 16,
		fontWeight: "500",
		marginBottom: 16,
	},
	sourceFrame: {
		width: 300,
		height: 100,
		aspectRatio: 16 / 9,
	},
	sourceVideo: {
		width: "100%",
		height: "100%",
		backgroundColor: "gray",
	},
});
