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
					<View style={[styles.metaChip, { borderColor: `${item.accent}66` }]}>
						<Text style={styles.metaLabel}>Location</Text>
						<Text style={styles.metaValue}>{item.location}</Text>
					</View>
					<View style={[styles.metaChip, { borderColor: `${item.accent}66` }]}>
						<Text style={styles.metaLabel}>Duration</Text>
						<Text style={styles.metaValue}>{item.duration}</Text>
					</View>
					<View style={[styles.metaChip, { borderColor: `${item.accent}66` }]}>
						<Text style={styles.metaLabel}>Best For</Text>
						<Text style={styles.metaValue}>{item.bestFor}</Text>
					</View>
				</View>

				<View style={[styles.card, { borderColor: `${item.accent}66` }]}>
					<Text style={[styles.kicker, { color: item.accent }]}>Overview</Text>
					<Text style={styles.headline}>{item.subtitle}</Text>
					<Text style={styles.body}>{item.overview}</Text>
				</View>

				<View style={styles.card}>
					<Text style={styles.kicker}>Highlights</Text>
					{item.highlights.map((highlight) => (
						<View key={highlight} style={styles.highlightRow}>
							<View
								style={[styles.highlightDot, { backgroundColor: item.accent }]}
							/>
							<Text style={styles.highlightText}>{highlight}</Text>
						</View>
					))}
				</View>

				<View style={styles.card}>
					<Text style={styles.kicker}>Show Others</Text>
					<Text style={styles.helperText}>
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
					style={[styles.button, { backgroundColor: item.accent }]}
					onPress={() =>
						router.navigate(
							buildStackPath(
								stackType,
								`bounds/zoom-nested/${item.id}/plan`,
							) as never,
						)
					}
				>
					<Text style={styles.buttonText}>Open Plan Screen</Text>
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
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.14)",
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
	card: {
		padding: 16,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.12)",
		backgroundColor: "rgba(0,0,0,0.22)",
	},
	kicker: {
		fontSize: 12,
		textTransform: "uppercase",
		letterSpacing: 0.8,
		fontWeight: "700",
		color: "rgba(255,255,255,0.6)",
	},
	headline: {
		marginTop: 6,
		fontSize: 22,
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
		color: "rgba(255,255,255,0.84)",
	},
	helperText: {
		marginTop: 6,
		fontSize: 14,
		lineHeight: 21,
		color: "rgba(255,255,255,0.7)",
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
