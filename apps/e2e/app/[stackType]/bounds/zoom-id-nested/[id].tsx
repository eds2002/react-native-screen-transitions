import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import {
	getNestedZoomIdItemById,
	getNestedZoomIdRelatedItems,
	type NestedZoomIdItem,
} from "./constants";

function RelatedCard({ item }: { item: NestedZoomIdItem }) {
	const stackType = useResolvedStackType();

	return (
		<Transition.Boundary.Pressable
			id={item.id}
			scaleMode="uniform"
			anchor="top"
			style={styles.relatedCard}
			onPress={() =>
				router.push(
					buildStackPath(stackType, `bounds/zoom-id-nested/${item.id}`) as never,
				)
			}
		>
			<Image source={item.image} style={styles.relatedImage} contentFit="cover" />
			<View style={styles.relatedOverlay}>
				<Text style={styles.relatedTitle}>{item.title}</Text>
				<Text style={styles.relatedSubtitle}>{item.subtitle}</Text>
			</View>
		</Transition.Boundary.Pressable>
	);
}

export default function NestedNavigationZoomIdDetail() {
	const { width } = useWindowDimensions();
	const insets = useSafeAreaInsets();
	const { id } = useLocalSearchParams<{ id?: string }>();
	const item = getNestedZoomIdItemById(id);
	const relatedItems = getNestedZoomIdRelatedItems(id);
	const imageWidth = width - 40;
	const imageHeight = imageWidth / item.aspectRatio;

	return (
		<View style={[styles.container, { backgroundColor: item.bgColor }]}>
			<View style={{ paddingTop: insets.top }}>
				<ScreenHeader
					title="Nested Navigation Zoom ID"
					subtitle={`${item.title} · ${item.location}`}
				/>
			</View>

			<Transition.ScrollView
				contentContainerStyle={[
					styles.content,
					{ paddingBottom: insets.bottom + 32 },
				]}
				showsVerticalScrollIndicator={false}
			>
				<Image
					source={item.image}
					style={[styles.hero, { width: imageWidth, height: imageHeight }]}
					contentFit="cover"
				/>

				<View style={styles.infoSection}>
					<Text style={styles.title}>{item.title}</Text>
					<Text style={styles.subtitle}>{item.subtitle}</Text>
					<Text style={styles.body}>{item.description}</Text>
				</View>

				<View style={styles.metaGrid}>
					<View style={styles.metaItem}>
						<Text style={styles.metaLabel}>Location</Text>
						<Text style={styles.metaValue}>{item.location}</Text>
					</View>
					<View style={styles.metaItem}>
						<Text style={styles.metaLabel}>Stay</Text>
						<Text style={styles.metaValue}>{item.stay}</Text>
					</View>
					<View style={styles.metaItem}>
						<Text style={styles.metaLabel}>Best For</Text>
						<Text style={styles.metaValue}>{item.bestFor}</Text>
					</View>
				</View>

				<View style={styles.noteCard}>
					<Text style={styles.noteTitle}>Show Others</Text>
					<Text style={styles.noteText}>
						Tap any related card below. It pushes the exact same detail route
						again with a new id so this example can prove whether id-only
						navigation zoom survives nested detail-to-detail hops.
					</Text>
				</View>

				<View style={styles.relatedHeader}>
					<Text style={styles.relatedHeaderTitle}>Similar Stops</Text>
					<Text style={styles.relatedHeaderMeta}>
						Same screen, same layout, new data
					</Text>
				</View>

				<View style={styles.relatedList}>
					{relatedItems.map((relatedItem) => (
						<RelatedCard key={relatedItem.id} item={relatedItem} />
					))}
				</View>

				<View style={styles.noteCard}>
					<Text style={styles.noteTitle}>Current Route</Text>
					<Text style={styles.noteText}>
						`bounds/zoom-id-nested/{item.id}`{`\n`}
						From here, pressing a related item pushes another
						`bounds/zoom-id-nested/[id]` screen onto the same stack.
					</Text>
				</View>
			</Transition.ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		paddingHorizontal: 20,
		gap: 20,
	},
	hero: {
		borderRadius: 22,
		overflow: "hidden",
		alignSelf: "center",
	},
	infoSection: {
		gap: 6,
	},
	title: {
		fontSize: 30,
		fontWeight: "800",
		color: "#fff",
		letterSpacing: -0.6,
	},
	subtitle: {
		fontSize: 14,
		color: "rgba(255,255,255,0.48)",
		fontWeight: "500",
	},
	body: {
		fontSize: 15,
		lineHeight: 24,
		color: "rgba(255,255,255,0.76)",
		marginTop: 8,
	},
	metaGrid: {
		flexDirection: "row",
		gap: 12,
	},
	metaItem: {
		flex: 1,
		backgroundColor: "rgba(255,255,255,0.06)",
		borderRadius: 16,
		padding: 16,
		gap: 6,
	},
	metaLabel: {
		fontSize: 11,
		fontWeight: "600",
		color: "rgba(255,255,255,0.34)",
		textTransform: "uppercase",
		letterSpacing: 0.8,
	},
	metaValue: {
		fontSize: 15,
		fontWeight: "700",
		color: "#fff",
	},
	noteCard: {
		backgroundColor: "rgba(255,255,255,0.04)",
		borderRadius: 18,
		padding: 18,
		gap: 8,
	},
	noteTitle: {
		fontSize: 13,
		fontWeight: "700",
		color: "rgba(255,255,255,0.38)",
		textTransform: "uppercase",
		letterSpacing: 1,
	},
	noteText: {
		fontSize: 14,
		lineHeight: 22,
		color: "rgba(255,255,255,0.56)",
	},
	relatedHeader: {
		gap: 4,
	},
	relatedHeaderTitle: {
		fontSize: 18,
		fontWeight: "700",
		color: "#fff",
	},
	relatedHeaderMeta: {
		fontSize: 13,
		color: "rgba(255,255,255,0.5)",
	},
	relatedList: {
		gap: 14,
	},
	relatedCard: {
		height: 158,
		borderRadius: 18,
		overflow: "hidden",
	},
	relatedImage: {
		...StyleSheet.absoluteFillObject,
	},
	relatedOverlay: {
		flex: 1,
		justifyContent: "flex-end",
		padding: 16,
		backgroundColor: "rgba(0,0,0,0.22)",
	},
	relatedTitle: {
		fontSize: 19,
		fontWeight: "800",
		color: "#fff",
		letterSpacing: -0.3,
	},
	relatedSubtitle: {
		marginTop: 3,
		fontSize: 12,
		lineHeight: 18,
		color: "rgba(255,255,255,0.76)",
	},
});
