import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/theme";

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
	light,
}: ScreenHeaderProps) {
	const theme = useTheme();
	const handleBack = onBack ?? (() => router.back());

	const isLight = light ?? false;
	const textColor = isLight ? "#000" : theme.text;
	const subtitleColor = isLight ? "rgba(0,0,0,0.5)" : theme.textSecondary;
	const backBg = isLight ? "rgba(0,0,0,0.06)" : theme.headerBackButton;

	return (
		<View style={styles.container}>
			<Pressable
				testID="header-back"
				style={[styles.backButton, { backgroundColor: backBg }]}
				onPress={handleBack}
				hitSlop={8}
			>
				<Ionicons name="chevron-back" size={24} color={textColor} />
			</Pressable>
			<View style={styles.titleContainer}>
				<Text style={[styles.title, { color: textColor }]}>{title}</Text>
				{subtitle && (
					<Text style={[styles.subtitle, { color: subtitleColor }]}>
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
		borderRadius: 999,
		justifyContent: "center",
		alignItems: "center",
	},
	titleContainer: {
		flex: 1,
	},
	title: {
		fontSize: 18,
		fontWeight: "600",
	},
	subtitle: {
		fontSize: 13,
		marginTop: 2,
	},
});
