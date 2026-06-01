import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { useTheme } from "@/theme";
import { ADAPTER_AVATAR_BOUNDARY_ID } from "./constants";

export default function NativeStackAdapterAvatar() {
	const theme = useTheme();

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
			<View style={styles.content}>
				<Transition.Boundary.View
					id={ADAPTER_AVATAR_BOUNDARY_ID}
					style={styles.avatar}
				>
					<Text style={styles.avatarText}>EA</Text>
				</Transition.Boundary.View>

				<View style={styles.copy}>
					<Text style={[styles.title, { color: theme.text }]}>
						Adapter Avatar
					</Text>
					<Text style={[styles.description, { color: theme.textSecondary }]}>
						This destination is rendered by the official native stack, while the
						transition context comes from the adapter.
					</Text>
				</View>

				<Pressable
					testID="native-stack-adapter-back"
					style={({ pressed }) => [
						styles.button,
						{
							backgroundColor: pressed ? theme.cardPressed : theme.actionButton,
						},
					]}
					onPress={router.back}
				>
					<Text style={[styles.buttonText, { color: theme.actionButtonText }]}>
						Go Back
					</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		gap: 28,
		padding: 24,
	},
	avatar: {
		width: 180,
		height: 180,
		borderRadius: 90,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#3B82F6",
	},
	avatarText: {
		color: "white",
		fontSize: 48,
		fontWeight: "900",
	},
	copy: {
		gap: 8,
		alignItems: "center",
	},
	title: {
		fontSize: 28,
		fontWeight: "800",
		textAlign: "center",
	},
	description: {
		fontSize: 15,
		lineHeight: 22,
		textAlign: "center",
		maxWidth: 300,
	},
	button: {
		borderRadius: 16,
		paddingHorizontal: 24,
		paddingVertical: 14,
	},
	buttonText: {
		fontSize: 16,
		fontWeight: "700",
	},
});
