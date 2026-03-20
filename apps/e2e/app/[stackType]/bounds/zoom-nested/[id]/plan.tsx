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
				router.push(buildStackPath(stackType, `bounds/zoom-nested/${item.id}`) as never);
			}}
		>
			<Image source={item.image} style={styles.relatedImage} contentFit="cover" />
			<View style={[styles.relatedOverlay, { backgroundColor: `${item.background}A8` }]}>
				<Text style={styles.relatedTitle}>{item.title}</Text>
				<Text style={styles.relatedSubtitle}>{item.subtitle}</Text>
			</View>
		</Transition.Boundary.Pressable>
	);
}

export default function NestedZoomGroupPlan() {
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
					title={`${item.title} · Plan`}
					subtitle="Nested child route"
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
					<Image source={item.image} style={styles.heroImage} contentFit="cover" />
				</Transition.Boundary.View>

				<View style={[styles.card, { borderColor: `${item.accent}66` }]}>
					<Text style={[styles.kicker, { color: item.accent }]}>Plan</Text>
					{item.plan.map((entry, index) => (
						<View key={entry} style={styles.planRow}>
							<View style={[styles.stepBubble, { borderColor: `${item.accent}80` }]}>
								<Text style={styles.stepText}>{index + 1}</Text>
							</View>
							<Text style={styles.planText}>{entry}</Text>
						</View>
					))}
				</View>

				<View style={styles.card}>
					<Text style={styles.kicker}>Retarget Inside Nested Route</Text>
					<Text style={styles.helperText}>
						These related cards live on the nested child screen, not the first
						destination screen. Pushing one should still move the group to the
						new active member.
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
							buildStackPath(stackType, `bounds/zoom-nested/${item.id}`) as never,
						)
					}
				>
					<Text style={styles.buttonText}>Back to Overview</Text>
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
		aspectRatio: 0.86,
		borderRadius: 22,
		overflow: "hidden",
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.14)",
	},
	heroImage: {
		width: "100%",
		height: "100%",
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
	planRow: {
		marginTop: 10,
		flexDirection: "row",
		alignItems: "flex-start",
	},
	stepBubble: {
		width: 24,
		height: 24,
		borderRadius: 99,
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
		marginRight: 10,
		backgroundColor: "rgba(0,0,0,0.16)",
	},
	stepText: {
		fontSize: 12,
		fontWeight: "700",
		color: "#F4F8FF",
	},
	planText: {
		flex: 1,
		fontSize: 14,
		lineHeight: 22,
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
		fontSize: 17,
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
