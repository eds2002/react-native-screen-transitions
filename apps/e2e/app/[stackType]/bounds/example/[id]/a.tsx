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
import { getNestedBoundsItemById } from "../constants";

export default function NestedBoundsScreenA() {
	const stackType = useResolvedStackType();
	const insets = useSafeAreaInsets();
	const { id } = useLocalSearchParams<{ id?: string }>();
	const item = getNestedBoundsItemById(id);

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
					<View style={[styles.metaChip, { borderColor: `${item.accent}66` }]}>
						<Text style={styles.metaLabel}>Duration</Text>
						<Text style={styles.metaValue}>{item.duration}</Text>
					</View>
					<View style={[styles.metaChip, { borderColor: `${item.accent}66` }]}>
						<Text style={styles.metaLabel}>Pace</Text>
						<Text style={styles.metaValue}>{item.pace}</Text>
					</View>
					<View style={[styles.metaChip, { borderColor: `${item.accent}66` }]}>
						<Text style={styles.metaLabel}>Best Time</Text>
						<Text style={styles.metaValue}>{item.bestTime}</Text>
					</View>
				</View>

				<View style={[styles.infoCard, { borderColor: `${item.accent}66` }]}>
					<Text style={[styles.kicker, { color: item.accent }]}>Overview</Text>
					<Text style={styles.title}>{item.subtitle}</Text>
					<Text style={styles.body}>{item.overview}</Text>
				</View>

				<View style={[styles.infoCard, { borderColor: "rgba(255,255,255,0.16)" }]}>
					<Text style={styles.kicker}>Highlights</Text>
					{item.highlights.map((highlight) => (
						<View key={highlight} style={styles.highlightRow}>
							<View
								style={[
									styles.highlightDot,
									{ backgroundColor: `${item.accent}EE` },
								]}
							/>
							<Text style={styles.highlightText}>{highlight}</Text>
						</View>
					))}
				</View>

				<Pressable
					style={[styles.button, { backgroundColor: item.accent }]}
					onPress={() =>
						router.navigate(
							buildStackPath(stackType, `bounds/example/${item.id}/b`) as never,
						)
					}
				>
					<Text style={styles.buttonText}>Open Day Plan</Text>
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
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.16)",
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
		borderRadius: 12,
		borderWidth: 1,
		backgroundColor: "rgba(255,255,255,0.03)",
	},
	metaLabel: {
		fontSize: 10,
		textTransform: "uppercase",
		letterSpacing: 0.7,
		color: "rgba(255,255,255,0.62)",
		fontWeight: "700",
	},
	metaValue: {
		marginTop: 4,
		fontSize: 13,
		fontWeight: "700",
		color: "#F2F7FE",
	},
	infoCard: {
		padding: 16,
		borderRadius: 16,
		borderWidth: 1,
		backgroundColor: "rgba(0,0,0,0.2)",
	},
	kicker: {
		fontSize: 12,
		textTransform: "uppercase",
		letterSpacing: 0.8,
		fontWeight: "700",
		color: "rgba(255,255,255,0.6)",
	},
	title: {
		marginTop: 6,
		fontSize: 20,
		fontWeight: "700",
		color: "#fff",
	},
	body: {
		marginTop: 8,
		fontSize: 14,
		lineHeight: 22,
		color: "rgba(255,255,255,0.78)",
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
		color: "rgba(255,255,255,0.84)",
	},
	button: {
		height: 52,
		borderRadius: 14,
		alignItems: "center",
		justifyContent: "center",
	},
	buttonText: {
		color: "#0b111a",
		fontSize: 17,
		fontWeight: "700",
	},
});
