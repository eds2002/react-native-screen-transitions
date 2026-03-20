import { Image } from "expo-image";
import { router } from "expo-router";
import {
	StyleSheet,
	Text,
	useWindowDimensions,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import {
	activeNestedZoomGroupId,
	NESTED_ZOOM_GROUP,
	NESTED_ZOOM_GROUP_ITEMS,
	type NestedZoomGroupItem,
} from "./constants";

const GAP = 10;
const PADDING = 16;

function NestedZoomGroupSourceCard({
	item,
	colWidth,
}: {
	item: NestedZoomGroupItem;
	colWidth: number;
}) {
	const stackType = useResolvedStackType();
	const isWide = item.id === "sedona" || item.id === "charleston";
	const cardWidth = isWide ? colWidth * 2 + GAP : colWidth;
	const cardHeight = isWide ? 172 : 212;

	return (
		<Transition.Boundary.Pressable
			group={NESTED_ZOOM_GROUP}
			id={item.id}
			anchor="center"
			scaleMode="uniform"
			style={[styles.card, { width: cardWidth, height: cardHeight }]}
			onPress={() => {
				activeNestedZoomGroupId.value = item.id;
				router.push(buildStackPath(stackType, `bounds/zoom-nested/${item.id}`) as never);
			}}
		>
			<Image source={item.image} style={styles.cardImage} contentFit="cover" />
			<View
				style={[
					styles.cardOverlay,
					{ backgroundColor: `${item.background}99` },
				]}
			>
				<Text style={styles.cardLocation}>{item.location}</Text>
				<Text style={styles.cardTitle}>{item.title}</Text>
				<Text style={styles.cardSubtitle}>{item.subtitle}</Text>
			</View>
		</Transition.Boundary.Pressable>
	);
}

export default function NestedNavigationZoomGroupIndex() {
	const { width } = useWindowDimensions();
	const colWidth = (width - PADDING * 2 - GAP) / 2;

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title="Nested Navigation Zoom Group"
				subtitle="Grouped zoom plus nested [id]/index and [id]/plan routes"
			/>

			<View style={styles.noteCard}>
				<Text style={styles.noteTitle}>What this proves</Text>
				<Text style={styles.noteBody}>
					Open a source card, move into the nested plan screen, then switch to a
					different destination from inside the subtree. Grouped matching should
					follow the current active member, not the originally opened one.
				</Text>
			</View>

			<Transition.ScrollView contentContainerStyle={styles.scrollContent}>
				<View style={styles.grid}>
					{NESTED_ZOOM_GROUP_ITEMS.map((item) => (
						<NestedZoomGroupSourceCard
							key={item.id}
							item={item}
							colWidth={colWidth}
						/>
					))}
				</View>
			</Transition.ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#121212",
	},
	noteCard: {
		marginHorizontal: PADDING,
		marginBottom: 14,
		padding: 14,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.08)",
		backgroundColor: "rgba(255,255,255,0.03)",
	},
	noteTitle: {
		fontSize: 12,
		fontWeight: "700",
		color: "rgba(255,255,255,0.72)",
		textTransform: "uppercase",
		letterSpacing: 0.9,
	},
	noteBody: {
		marginTop: 6,
		fontSize: 14,
		lineHeight: 21,
		color: "rgba(255,255,255,0.62)",
	},
	scrollContent: {
		paddingHorizontal: PADDING,
		paddingBottom: 40,
	},
	grid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: GAP,
	},
	card: {
		borderRadius: 22,
		overflow: "hidden",
		justifyContent: "flex-end",
	},
	cardImage: {
		...StyleSheet.absoluteFillObject,
	},
	cardOverlay: {
		flex: 1,
		justifyContent: "flex-end",
		padding: 14,
	},
	cardLocation: {
		fontSize: 10,
		fontWeight: "700",
		textTransform: "uppercase",
		letterSpacing: 0.8,
		color: "rgba(255,255,255,0.68)",
		marginBottom: 8,
	},
	cardTitle: {
		color: "#fff",
		fontSize: 20,
		fontWeight: "800",
		letterSpacing: -0.3,
	},
	cardSubtitle: {
		marginTop: 4,
		color: "rgba(255,255,255,0.78)",
		fontSize: 12,
		fontWeight: "500",
	},
});
