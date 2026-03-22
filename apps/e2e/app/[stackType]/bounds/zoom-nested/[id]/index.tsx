import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import {
	activeNestedZoomGroupId,
	getNestedZoomGroupItemById,
	getNestedZoomGroupRelatedItems,
	NESTED_ZOOM_GROUP,
	type NestedZoomGroupItem,
} from "../constants";
import { useTheme } from "@/theme";

function RelatedCard({ item }: { item: NestedZoomGroupItem }) {
	const stackType = useResolvedStackType();

	return (
		<Transition.Boundary.Pressable
			group={NESTED_ZOOM_GROUP}
			id={item.id}
			anchor="center"
			scaleMode="uniform"
			style={styles.relatedCard}
			onPress={() => {
				activeNestedZoomGroupId.value = item.id;
				router.push(
					buildStackPath(stackType, `bounds/zoom-nested/${item.id}`) as never,
				);
			}}
		>
			<Image
				source={item.image}
				style={styles.relatedImage}
				contentFit="cover"
			/>
			<View
				style={[
					styles.relatedOverlay,
					{ backgroundColor: `${item.background}A8` },
				]}
			>
				<Text style={styles.relatedTitle}>{item.title}</Text>
				<Text style={styles.relatedSubtitle}>{item.subtitle}</Text>
			</View>
		</Transition.Boundary.Pressable>
	);
}

export default function NestedZoomGroupOverview() {
	const stackType = useResolvedStackType();
	const insets = useSafeAreaInsets();
	const { id } = useLocalSearchParams<{ id?: string }>();
	const item = getNestedZoomGroupItemById(id);
	const relatedItems = getNestedZoomGroupRelatedItems(id);
	const theme = useTheme();

	useEffect(() => {
		activeNestedZoomGroupId.value = item.id;
	}, [item.id]);

	return (
		<View style={[styles.container, { backgroundColor: item.background }]}>
			<View style={{ paddingTop: insets.top }}>
				<ScreenHeader
					title={`${item.title} · Overview`}
					subtitle="Grouped nested destination"
				/>
			</View>

			<Transition.ScrollView
				contentContainerStyle={[
					styles.content,
					{ paddingBottom: insets.bottom + 28 },
				]}
				showsVerticalScrollIndicator={false}
			>
				<Transition.Boundary.View
					group={NESTED_ZOOM_GROUP}
					id={item.id}
					anchor="center"
					scaleMode="uniform"
					style={styles.hero}
				>
					<Image source={item.image} style={styles.hero} contentFit="cover" />
				</Transition.Boundary.View>

				<View style={styles.metaRow}>
					<View style={[styles.metaChip, { backgroundColor: theme.surface }]}>
						<Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Location</Text>
						<Text style={[styles.metaValue, { color: theme.text }]}>{item.location}</Text>
					</View>
					<View style={[styles.metaChip, { backgroundColor: theme.surface }]}>
						<Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Duration</Text>
						<Text style={[styles.metaValue, { color: theme.text }]}>{item.duration}</Text>
					</View>
					<View style={[styles.metaChip, { backgroundColor: theme.surface }]}>
						<Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Best For</Text>
						<Text style={[styles.metaValue, { color: theme.text }]}>{item.bestFor}</Text>
					</View>
				</View>

				<View style={[styles.card, { backgroundColor: theme.surfaceElevated }]}>
					<Text style={[styles.kicker, { color: item.accent }]}>Overview</Text>
					<Text style={[styles.headline, { color: theme.text }]}>{item.subtitle}</Text>
					<Text style={[styles.body, { color: theme.textSecondary }]}>{item.overview}</Text>
				</View>

				<View style={[styles.card, { backgroundColor: theme.surfaceElevated }]}>
					<Text style={[styles.kicker, { color: theme.textSecondary }]}>Highlights</Text>
					{item.highlights.map((highlight) => (
						<View key={highlight} style={styles.highlightRow}>
							<View
								style={[styles.highlightDot, { backgroundColor: item.accent }]}
							/>
							<Text style={[styles.highlightText, { color: theme.textSecondary }]}>{highlight}</Text>
						</View>
					))}
				</View>

				<View style={[styles.card, { backgroundColor: theme.surfaceElevated }]}>
					<Text style={[styles.kicker, { color: theme.textSecondary }]}>Show Others</Text>
					<Text style={[styles.helperText, { color: theme.textSecondary }]}>
						These cards push a new grouped destination from inside dst. This is
						the actual nested retargeting case.
					</Text>
					<View style={styles.relatedList}>
						{relatedItems.map((relatedItem) => (
							<RelatedCard key={relatedItem.id} item={relatedItem} />
						))}
					</View>
				</View>

				<Pressable
					style={({ pressed }) => [
						styles.button,
						{ backgroundColor: pressed ? theme.actionButtonPressed : item.accent },
					]}
					onPress={() =>
						router.navigate(
							buildStackPath(
								stackType,
								`bounds/zoom-nested/${item.id}/plan`,
							) as never,
						)
					}
				>
					<Text style={[styles.buttonText, { color: theme.actionButtonText }]}>Open Plan Screen</Text>
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
		aspectRatio: 1.05,
		borderRadius: 22,
		overflow: "hidden",
	},
	heroImage: {
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
	card: {
		padding: 16,
		borderRadius: 14,
	},
	kicker: {
		fontSize: 12,
		textTransform: "uppercase",
		letterSpacing: 0.8,
		fontWeight: "700",
	},
	headline: {
		marginTop: 6,
		fontSize: 22,
		fontWeight: "700",
	},
	body: {
		marginTop: 8,
		fontSize: 14,
		lineHeight: 22,
	},
	highlightRow: {
		marginTop: 10,
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
	helperText: {
		marginTop: 6,
		fontSize: 14,
		lineHeight: 21,
	},
	relatedList: {
		marginTop: 14,
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 12,
	},
	relatedCard: {
		width: "47%",
		aspectRatio: 1,
		borderRadius: 18,
		overflow: "hidden",
	},
	relatedImage: {
		...StyleSheet.absoluteFillObject,
	},
	relatedOverlay: {
		flex: 1,
		justifyContent: "flex-end",
		padding: 14,
	},
	relatedTitle: {
		fontSize: 18,
		fontWeight: "800",
		color: "#fff",
		letterSpacing: -0.3,
	},
	relatedSubtitle: {
		marginTop: 3,
		fontSize: 12,
		lineHeight: 18,
		color: "rgba(255,255,255,0.78)",
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
