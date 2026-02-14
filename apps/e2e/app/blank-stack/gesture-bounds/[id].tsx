import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";

export default function GestureBoundsDetail() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const tag = `gesture-bounds-${id}`;

	return (
		<Transition.View sharedBoundTag={tag} style={styles.wrapper}>
			<SafeAreaView style={styles.container} edges={["top"]}>
				<ScreenHeader title="Gesture Bounds" subtitle="Swipe down to dismiss" />
				<View style={styles.content}>
					<Text style={styles.text}>{`sharedBoundTag\n"${tag}"`}</Text>
					<Text style={styles.hint}>
						Drag around to see the unfocused bound follow the gesture
					</Text>
				</View>
			</SafeAreaView>
		</Transition.View>
	);
}

const styles = StyleSheet.create({
	wrapper: {
		flex: 1,
		backgroundColor: "#1a1a2e",
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
		color: "#fff",
		textAlign: "center",
		marginBottom: 16,
	},
	hint: {
		fontSize: 13,
		color: "#888",
		textAlign: "center",
	},
});
