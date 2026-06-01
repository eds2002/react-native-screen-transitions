import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { useTheme } from "@/theme";
import { ADAPTER_AVATAR_BOUNDARY_ID } from "./constants";

export default function NativeStackAdapterIndex() {
	const theme = useTheme();

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
			<View style={styles.header}>
				<Text style={[styles.eyebrow, { color: theme.textTertiary }]}>
					Official Native Stack
				</Text>
				<Text style={[styles.title, { color: theme.text }]}>Adapter Route</Text>
				<Text style={[styles.description, { color: theme.textSecondary }]}>
					This nested route uses @react-navigation/native-stack through
					withScreenTransitions.
				</Text>
			</View>

			<Transition.Boundary.Trigger
				id={ADAPTER_AVATAR_BOUNDARY_ID}
				testID="native-stack-adapter-avatar-trigger"
				style={[styles.profileCard, { backgroundColor: theme.card }]}
				onPress={() => router.push("/native-stack-adapter/avatar")}
			>
				<View style={styles.avatar}>
					<Text style={styles.avatarText}>EA</Text>
				</View>
				<View style={styles.profileCopy}>
					<Text style={[styles.profileTitle, { color: theme.text }]}>
						Open Avatar
					</Text>
					<Text
						style={[styles.profileDescription, { color: theme.textSecondary }]}
					>
						Press the avatar card to push a transitioned native-stack screen.
					</Text>
				</View>
			</Transition.Boundary.Trigger>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 24,
		gap: 24,
	},
	header: {
		marginTop: 48,
		gap: 8,
	},
	eyebrow: {
		fontSize: 12,
		fontWeight: "700",
		letterSpacing: 1,
		textTransform: "uppercase",
	},
	title: {
		fontSize: 32,
		fontWeight: "800",
	},
	description: {
		fontSize: 15,
		lineHeight: 22,
	},
	profileCard: {
		flexDirection: "row",
		alignItems: "center",
		gap: 16,
		borderRadius: 24,
		padding: 16,
	},
	avatar: {
		width: 80,
		height: 80,
		borderRadius: 40,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#3B82F6",
	},
	avatarText: {
		color: "white",
		fontSize: 24,
		fontWeight: "800",
	},
	profileCopy: {
		flex: 1,
		gap: 4,
	},
	profileTitle: {
		fontSize: 18,
		fontWeight: "700",
	},
	profileDescription: {
		fontSize: 13,
		lineHeight: 18,
	},
});
