import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

export default function GestureBoundsDetail() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const tag = `gesture-bounds-${id}`;
	const theme = useTheme();

	return (
		<Transition.Boundary.View id={tag} style={[styles.wrapper, { backgroundColor: theme.bg }]}>
			<SafeAreaView style={styles.container} edges={["top"]}>
				<ScreenHeader title="Gesture Bounds" subtitle="Swipe down to dismiss" />
				<View style={styles.content}>
					<Text style={[styles.text, { color: theme.text }]}>{`Transition.Boundary id\n"${tag}"`}</Text>
					<Text style={[styles.hint, { color: theme.textTertiary }]}>
						Drag around to see the unfocused bound follow the gesture
					</Text>
				</View>
			</SafeAreaView>
		</Transition.Boundary.View>
	);
}

const styles = StyleSheet.create({
	wrapper: {
		flex: 1,
	},
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		padding: 24,
	},
	text: {
		fontSize: 16,
		fontWeight: "500",
		textAlign: "center",
		marginBottom: 16,
	},
	hint: {
		fontSize: 13,
		textAlign: "center",
	},
});
