import { router } from "expo-router";
import type React from "react";
import {
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	View,
	type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { type Theme, useTheme } from "@/theme";
import { ScreenHeader } from "./screen-header";

/* ─── ListScreen ─────────────────────────────────────────────────────── */

type ListItem = {
	id: string;
	title: string;
	description: string;
	scenario?: string;
};

/**
 * Full-screen list of navigable items with themed styling.
 * Use for index screens that list test flows / examples.
 */
export function ListScreen({
	title,
	subtitle,
	items,
	testIdPrefix,
	onPress,
	edges = ["top"],
}: {
	title: string;
	subtitle?: string;
	items: ListItem[];
	testIdPrefix: string;
	onPress: (id: string) => void;
	edges?: ("top" | "bottom" | "left" | "right")[];
}) {
	const theme = useTheme();

	return (
		<SafeAreaView
			style={[styles.screen, { backgroundColor: theme.bg }]}
			edges={edges}
		>
			<ScreenHeader title={title} subtitle={subtitle} />
			<ScrollView contentContainerStyle={styles.listContent}>
				<View style={styles.list}>
					{items.map((item) => (
						<Pressable
							key={item.id}
							testID={`${testIdPrefix}-${item.id}`}
							style={({ pressed }) => [
								styles.listItem,
								{ backgroundColor: pressed ? theme.cardPressed : theme.card },
							]}
							onPress={() => onPress(item.id)}
						>
							<Text style={[styles.listItemTitle, { color: theme.text }]}>
								{item.title}
							</Text>
							<Text
								style={[styles.listItemDesc, { color: theme.textSecondary }]}
							>
								{item.description}
							</Text>
							{item.scenario && (
								<Text
									style={[styles.listItemScenario, { color: theme.scenario }]}
								>
									{item.scenario}
								</Text>
							)}
						</Pressable>
					))}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

/* ─── InfoCard ───────────────────────────────────────────────────────── */

/**
 * Flat themed card for displaying informational content.
 */
export function InfoCard({
	title,
	children,
	style,
}: {
	title?: string;
	children: React.ReactNode;
	style?: ViewStyle;
}) {
	const theme = useTheme();

	return (
		<View style={[styles.infoCard, { backgroundColor: theme.card }, style]}>
			{title && (
				<Text style={[styles.infoCardTitle, { color: theme.text }]}>
					{title}
				</Text>
			)}
			{children}
		</View>
	);
}

/* ─── ActionButton ───────────────────────────────────────────────────── */

/**
 * Themed pill button. Always fully circular (borderRadius: 999).
 */
export function ActionButton({
	title,
	onPress,
	testID,
	variant = "primary",
	disabled,
	style,
}: {
	title: string;
	onPress: () => void;
	testID?: string;
	variant?: "primary" | "secondary";
	disabled?: boolean;
	style?: ViewStyle;
}) {
	const theme = useTheme();

	const isPrimary = variant === "primary";
	const bg = isPrimary ? theme.actionButton : theme.secondaryButton;
	const bgPressed = isPrimary
		? theme.actionButtonPressed
		: theme.secondaryButtonPressed;
	const textColor = isPrimary
		? theme.actionButtonText
		: theme.secondaryButtonText;

	return (
		<Pressable
			testID={testID}
			disabled={disabled}
			style={({ pressed }) => [
				styles.actionButton,
				{ backgroundColor: pressed ? bgPressed : bg },
				disabled && styles.actionButtonDisabled,
				style,
			]}
			onPress={onPress}
		>
			<Text style={[styles.actionButtonText, { color: textColor }]}>
				{title}
			</Text>
		</Pressable>
	);
}

/* ─── DemoScreen ─────────────────────────────────────────────────────── */

/**
 * Themed screen container for demo/test content screens.
 * Uses theme.bg by default; pass `tint` for colored demo backgrounds.
 */
export function DemoScreen({
	children,
	tint,
	style,
}: {
	children: React.ReactNode;
	tint?: string;
	style?: ViewStyle;
}) {
	const theme = useTheme();
	return (
		<SafeAreaView
			style={[styles.screen, { backgroundColor: tint ?? theme.bg }, style]}
			edges={["top"]}
		>
			{children}
		</SafeAreaView>
	);
}

/* ─── Styles ─────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
	screen: {
		flex: 1,
	},
	listContent: {
		padding: 16,
	},
	list: {
		gap: 10,
	},
	listItem: {
		padding: 16,
		borderRadius: 14,
	},
	listItemTitle: {
		fontSize: 16,
		fontWeight: "600",
		marginBottom: 4,
	},
	listItemDesc: {
		fontSize: 13,
	},
	listItemScenario: {
		fontSize: 11,
		marginTop: 8,
		fontFamily: "monospace",
	},
	infoCard: {
		borderRadius: 14,
		padding: 16,
	},
	infoCardTitle: {
		fontSize: 16,
		fontWeight: "700",
		marginBottom: 8,
	},
	actionButton: {
		paddingVertical: 16,
		paddingHorizontal: 24,
		borderRadius: 999,
		alignItems: "center",
	},
	actionButtonDisabled: {
		opacity: 0.5,
	},
	actionButtonText: {
		fontSize: 16,
		fontWeight: "600",
	},
});
