import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { useTheme } from "@/theme";
import { getNestedBoundsItemById } from "../constants";

export default function NestedBoundsScreenA() {
	const stackType = useResolvedStackType();
	const insets = useSafeAreaInsets();
	const { id } = useLocalSearchParams<{ id?: string }>();
	const item = getNestedBoundsItemById(id);
	const theme = useTheme();

	return (
		<View style={[styles.container, { backgroundColor: item.background }]}>
			<View style={{ paddingTop: insets.top }}>
				<ScreenHeader
					title={`${item.title} · Overview`}
					subtitle={`${item.location} · ${item.duration}`}
				/>
			</View>

			<Transition.ScrollView
				contentContainerStyle={[
					styles.content,
					{ paddingBottom: insets.bottom + 28 },
				]}
				showsVerticalScrollIndicator={false}
			>
				<View style={styles.hero}>
					<Image source={item.image} style={styles.image} contentFit="cover" />
				</View>

				<View style={styles.metaRow}>
					<View style={[styles.metaChip, { backgroundColor: theme.surface }]}>
						<Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Duration</Text>
						<Text style={[styles.metaValue, { color: theme.text }]}>{item.duration}</Text>
					</View>
					<View style={[styles.metaChip, { backgroundColor: theme.surface }]}>
						<Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Pace</Text>
						<Text style={[styles.metaValue, { color: theme.text }]}>{item.pace}</Text>
					</View>
					<View style={[styles.metaChip, { backgroundColor: theme.surface }]}>
						<Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Best Time</Text>
						<Text style={[styles.metaValue, { color: theme.text }]}>{item.bestTime}</Text>
					</View>
				</View>

				<View style={[styles.infoCard, { backgroundColor: theme.surfaceElevated }]}>
					<Text style={[styles.kicker, { color: item.accent }]}>Overview</Text>
					<Text style={[styles.title, { color: theme.text }]}>{item.subtitle}</Text>
					<Text style={[styles.body, { color: theme.textSecondary }]}>{item.overview}</Text>
				</View>

				<View style={[styles.infoCard, { backgroundColor: theme.surfaceElevated }]}>
					<Text style={[styles.kicker, { color: theme.textSecondary }]}>Highlights</Text>
					{item.highlights.map((highlight) => (
						<View key={highlight} style={styles.highlightRow}>
							<View
								style={[
									styles.highlightDot,
									{ backgroundColor: `${item.accent}EE` },
								]}
							/>
							<Text style={[styles.highlightText, { color: theme.textSecondary }]}>{highlight}</Text>
						</View>
					))}
				</View>

				<Pressable
					style={({ pressed }) => [
						styles.button,
						{ backgroundColor: pressed ? theme.actionButtonPressed : item.accent },
					]}
					onPress={() =>
						router.navigate(
							buildStackPath(stackType, `bounds/example/${item.id}/b`) as never,
						)
					}
				>
					<Text style={[styles.buttonText, { color: theme.actionButtonText }]}>Open Day Plan</Text>
				</Pressable>
			</Transition.ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		paddingHorizontal: 16,
		gap: 16,
	},
	hero: {
		width: "100%",
		aspectRatio: 1.02,
		borderRadius: 20,
		overflow: "hidden",
	},
	image: {
		width: "100%",
		height: "100%",
	},
	metaRow: {
		flexDirection: "row",
		gap: 8,
	},
	metaChip: {
		flex: 1,
		padding: 10,
		borderRadius: 14,
	},
	metaLabel: {
		fontSize: 10,
		textTransform: "uppercase",
		letterSpacing: 0.7,
		fontWeight: "700",
	},
	metaValue: {
		marginTop: 4,
		fontSize: 13,
		fontWeight: "700",
	},
	infoCard: {
		padding: 16,
		borderRadius: 14,
	},
	kicker: {
		fontSize: 12,
		textTransform: "uppercase",
		letterSpacing: 0.8,
		fontWeight: "700",
	},
	title: {
		marginTop: 6,
		fontSize: 20,
		fontWeight: "700",
	},
	body: {
		marginTop: 8,
		fontSize: 14,
		lineHeight: 22,
	},
	highlightRow: {
		marginTop: 9,
		flexDirection: "row",
		alignItems: "center",
	},
	highlightDot: {
		width: 7,
		height: 7,
		borderRadius: 99,
		marginRight: 10,
	},
	highlightText: {
		flex: 1,
		fontSize: 14,
		lineHeight: 20,
	},
	button: {
		height: 52,
		borderRadius: 999,
		alignItems: "center",
		justifyContent: "center",
	},
	buttonText: {
		fontSize: 17,
		fontWeight: "700",
	},
});
