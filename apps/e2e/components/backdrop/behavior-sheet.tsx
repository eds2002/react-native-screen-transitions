import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type BehaviorSheetProps = {
	icon: keyof typeof Ionicons.glyphMap;
	tone: string;
	title: string;
	description: string;
	primaryLabel: string;
	hint: string;
	maxSnap?: number;
};

export function BackdropBehaviorSheet({
	icon,
	tone,
	title,
	description,
	primaryLabel,
	hint,
	maxSnap = 0.5,
}: BehaviorSheetProps) {
	return (
		<View style={styles.container} pointerEvents="box-none">
			<View
				style={[styles.sheet, { maxHeight: SCREEN_HEIGHT * maxSnap }]}
				pointerEvents="auto"
			>
				<View style={styles.handle} />
				<View style={[styles.iconCircle, { backgroundColor: `${tone}20` }]}>
					<Ionicons name={icon} size={30} color={tone} />
				</View>
				<Text style={styles.title}>{title}</Text>
				<Text style={styles.description}>{description}</Text>
				<Pressable
					style={[styles.primaryButton, { backgroundColor: tone }]}
					onPress={() => router.back()}
				>
					<Text style={styles.primaryText}>{primaryLabel}</Text>
				</Pressable>
				<Text style={styles.hint}>{hint}</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	sheet: {
		flex: 1,
		backgroundColor: "#0D0D1A",
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		paddingHorizontal: 24,
		paddingTop: 12,
		alignItems: "center",
	},
	handle: {
		width: 44,
		height: 5,
		backgroundColor: "rgba(255,255,255,0.2)",
		borderRadius: 3,
		marginBottom: 20,
	},
	iconCircle: {
		width: 68,
		height: 68,
		borderRadius: 24,
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 16,
	},
	title: {
		fontSize: 26,
		fontWeight: "900",
		color: "#fff",
		marginBottom: 8,
		textAlign: "center",
	},
	description: {
		fontSize: 15,
		fontWeight: "500",
		color: "rgba(255,255,255,0.45)",
		textAlign: "center",
		lineHeight: 22,
		marginBottom: 24,
	},
	primaryButton: {
		borderRadius: 18,
		paddingVertical: 16,
		width: "100%",
		alignItems: "center",
		marginBottom: 14,
	},
	primaryText: {
		fontSize: 17,
		fontWeight: "900",
		color: "#fff",
	},
	hint: {
		fontSize: 12,
		fontWeight: "600",
		color: "rgba(255,255,255,0.3)",
		textAlign: "center",
	},
});
