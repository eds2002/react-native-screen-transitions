import { Image } from "expo-image";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { useTheme } from "@/theme";
import { PROFILE_IMAGE_BOUNDARY_ID, PROFILE_IMAGE_URL } from "./constants";

const MOCK_STATS = [
	{ label: "Projects", value: "18" },
	{ label: "Followers", value: "12.4K" },
	{ label: "Following", value: "312" },
];

const MOCK_ROWS = [
	"Senior product designer at Northstar Labs",
	"San Francisco, CA",
	"Available for design systems and motion work",
];

export default function NativeStackAdapterRecipeProfile() {
	const theme = useTheme();

	return (
		<SafeAreaView
			edges={["bottom"]}
			style={[
				styles.container,
				{ paddingVertical: 24, backgroundColor: theme.bg },
			]}
		>
			<ScrollView
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
			>
				<Transition.Boundary.Trigger
					id={PROFILE_IMAGE_BOUNDARY_ID}
					testID="native-stack-adapter-recipe-profile-image"
					style={styles.avatarButton}
					onPress={() => router.push("/native-stack-adapter-recipe/avatar")}
				>
					<Image
						source={PROFILE_IMAGE_URL}
						style={styles.avatar}
						contentFit="cover"
					/>
				</Transition.Boundary.Trigger>

				<View style={styles.identity}>
					<Text style={[styles.name, { color: theme.text }]}>Maya Chen</Text>
					<Text style={[styles.handle, { color: theme.textSecondary }]}>
						@mayachen
					</Text>
				</View>

				<View style={[styles.stats, { backgroundColor: theme.card }]}>
					{MOCK_STATS.map((stat) => (
						<View key={stat.label} style={styles.stat}>
							<Text style={[styles.statValue, { color: theme.text }]}>
								{stat.value}
							</Text>
							<Text style={[styles.statLabel, { color: theme.textSecondary }]}>
								{stat.label}
							</Text>
						</View>
					))}
				</View>

				<View style={styles.rows}>
					{MOCK_ROWS.map((row) => (
						<View
							key={row}
							style={[styles.row, { backgroundColor: theme.card }]}
						>
							<Text style={[styles.rowText, { color: theme.text }]}>{row}</Text>
						</View>
					))}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		alignItems: "center",
		paddingTop: 112,
		paddingHorizontal: 24,
		paddingBottom: 36,
		gap: 22,
	},
	avatarButton: {
		width: 160,
		height: 160,
		borderRadius: 80,
		overflow: "hidden",
	},
	avatar: {
		width: "100%",
		height: "100%",
	},
	identity: {
		alignItems: "center",
		gap: 4,
	},
	name: {
		fontSize: 30,
		fontWeight: "800",
	},
	handle: {
		fontSize: 16,
		fontWeight: "600",
	},
	stats: {
		width: "100%",
		borderRadius: 24,
		flexDirection: "row",
		paddingVertical: 18,
	},
	stat: {
		flex: 1,
		alignItems: "center",
		gap: 4,
	},
	statValue: {
		fontSize: 20,
		fontWeight: "800",
	},
	statLabel: {
		fontSize: 12,
		fontWeight: "700",
		textTransform: "uppercase",
	},
	rows: {
		width: "100%",
		gap: 10,
	},
	row: {
		borderRadius: 18,
		padding: 16,
	},
	rowText: {
		fontSize: 15,
		fontWeight: "600",
	},
});
