import { router } from "expo-router";
import {
	Pressable,
	StyleSheet,
	Text,
	useWindowDimensions,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import {
	activeZoomId,
	BOUNDS_SYNC_ZOOM_ITEMS,
	type BoundsSyncZoomItem,
	ZOOM_GROUP,
} from "../zoom.constants";

const GAP = 10;
const PADDING = 16;

function ZoomSourceCard({
	item,
	colWidth,
}: {
	item: BoundsSyncZoomItem;
	colWidth: number;
}) {
	const cardWidth = item.cols === 2 ? colWidth * 2 + GAP : colWidth;

	return (
		<Transition.Boundary
			group={ZOOM_GROUP}
			scaleMode="uniform"
			mode="source"
			id={item.id}
			style={[
				styles.card,
				{
					backgroundColor: item.color,
					width: cardWidth,
					height: item.height,
				},
			]}
			pointerEvents="box-none"
		>
			<Pressable
				onPress={() => {
					activeZoomId.value = item.id;
					router.push(`/bounds-sync/zoom/${item.id}` as never);
				}}
				style={{ flex: 1 }}
			>
				<Text style={styles.title}>{item.title}</Text>
				<Text style={styles.subtitle}>{item.subtitle}</Text>
			</Pressable>
		</Transition.Boundary>
	);
}

export default function BoundsSyncZoomIndex() {
	const { width } = useWindowDimensions();
	const colWidth = (width - PADDING * 2 - GAP) / 2;

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title="Bounds Sync: Navigation Zoom"
				subtitle="bounds({ id }).navigation.zoom()"
			/>

			<Transition.ScrollView contentContainerStyle={styles.scrollContent}>
				<View style={styles.grid}>
					{BOUNDS_SYNC_ZOOM_ITEMS.map((item) => (
						<ZoomSourceCard key={item.id} item={item} colWidth={colWidth} />
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
	scrollContent: {
		paddingHorizontal: PADDING,
		paddingBottom: 40,
		overflow: "visible",
	},
	grid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: GAP,
		overflow: "visible",
	},
	cardLayer: {
		position: "relative",
	},
	card: {
		borderRadius: 20,
		padding: 14,
		justifyContent: "flex-end",
		overflow: "hidden",
	},
	title: {
		color: "#fff",
		fontSize: 18,
		fontWeight: "700",
	},
	subtitle: {
		marginTop: 2,
		color: "rgba(255,255,255,0.75)",
		fontSize: 11,
		fontWeight: "500",
	},
});
