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
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { useTheme } from "@/theme";
import {
	activeZoomId,
	BOUNDS_SYNC_ZOOM_ITEMS,
	type BoundsSyncZoomItem,
	navigationZoomId,
	ZOOM_GROUP,
} from "./constants";

const GAP = 10;
const PADDING = 16;

function ZoomSourceCard({
	item,
	colWidth,
}: {
	item: BoundsSyncZoomItem;
	colWidth: number;
}) {
	const stackType = useResolvedStackType();
	const cardWidth = item.cols === 2 ? colWidth * 2 + GAP : colWidth;

	return (
		<Transition.Boundary.Trigger
			group={ZOOM_GROUP}
			id={item.id}
			style={[
				styles.card,
				{
					backgroundColor: item.color,
					width: cardWidth,
					height: item.height,
				},
			]}
			onPress={() => {
				activeZoomId.value = item.id;
				navigationZoomId.value = item.id;
				router.push(
					buildStackPath(stackType, `bounds/zoom/${item.id}`) as never,
				);
			}}
		>
			<Text style={styles.title}>{item.title}</Text>
			<Text style={styles.subtitle}>{item.subtitle}</Text>
		</Transition.Boundary.Trigger>
	);
}

export default function NavigationZoomGroupTransitionsIndex() {
	const { width } = useWindowDimensions();
	const colWidth = (width - PADDING * 2 - GAP) / 2;
	const theme = useTheme();

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.bg }]}
			edges={["top"]}
		>
			<ScreenHeader
				title="Navigation Zoom Group Transitions"
				subtitle="bounds({ id, group }).navigation.zoom()"
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
