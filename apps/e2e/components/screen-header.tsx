import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

interface ScreenHeaderProps {
	title: string;
	subtitle?: string;
	onBack?: () => void;
	light?: boolean;
}

export function ScreenHeader({
	title,
	subtitle,
	onBack,
	light = false,
}: ScreenHeaderProps) {
	const handleBack = onBack ?? (() => router.back());

	return (
		<View style={styles.container}>
			<Pressable
				testID="header-back"
				style={styles.backButton}
				onPress={handleBack}
				hitSlop={8}
			>
				<Ionicons
					name="chevron-back"
					size={24}
					color={light ? "#000" : "#fff"}
				/>
			</Pressable>
			<View style={styles.titleContainer}>
				<Text style={[styles.title, light && styles.titleLight]}>{title}</Text>
				{subtitle && (
					<Text style={[styles.subtitle, light && styles.subtitleLight]}>
						{subtitle}
					</Text>
				)}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: 16,
		paddingVertical: 12,
		gap: 8,
	},
	backButton: {
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: "rgba(255,255,255,0.1)",
		justifyContent: "center",
		alignItems: "center",
	},
	titleContainer: {
		flex: 1,
	},
	title: {
		fontSize: 18,
		fontWeight: "600",
		color: "#fff",
	},
	titleLight: {
		color: "#000",
	},
	subtitle: {
		fontSize: 13,
		color: "rgba(255,255,255,0.6)",
		marginTop: 2,
	},
	subtitleLight: {
		color: "rgba(0,0,0,0.6)",
	},
});
