import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import {
	ScrollView,
	StyleSheet,
	Text,
	useWindowDimensions,
	View,
} from "react-native";
import {
	SafeAreaView,
	useSafeAreaInsets,
} from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { useTheme } from "@/theme";

type BoardItem = {
	id: string;
	title: string;
	subtitle: string;
	description: string;
	source: string;
};

const BOARDS = [
	{
		id: "atlas",
		title: "Atlas",
		subtitle: "142 pins",
		description:
			"Far-away references kept for projects that haven't started yet — mostly cities, mostly mid-century, mostly accidental.",
		source: "https://picsum.photos/id/1011/1000/1000",
	},
	{
		id: "coast",
		title: "Coast",
		subtitle: "87 pins",
		description:
			"Bleached wood, faded blues, salt on glass. The visual quiet of being out of season.",
		source: "https://picsum.photos/id/1016/1000/1000",
	},
	{
		id: "drift",
		title: "Drift",
		subtitle: "56 pins",
		description:
			"Slow gradients and late-evening tones — the in-between colors I keep stealing for backgrounds.",
		source: "https://picsum.photos/id/1039/1000/1000",
	},
	{
		id: "grain",
		title: "Grain",
		subtitle: "234 pins",
		description:
			"Texture-first — paper, burlap, weathered metal. Useful when a clean board feels too clean.",
		source: "https://picsum.photos/id/1040/1000/1000",
	},
	{
		id: "summit",
		title: "Summit",
		subtitle: "41 pins",
		description:
			"Cold light and sharp edges. A working board for a quiet ongoing brief I haven't finished pitching.",
		source: "https://picsum.photos/id/1036/1000/1000",
	},
	{
		id: "canopy",
		title: "Canopy",
		subtitle: "98 pins",
		description:
			"Forest greens and the light through them — started for a friend's wedding moodboard, never closed it.",
		source: "https://picsum.photos/id/1047/1000/1000",
	},
] satisfies BoardItem[];

const PICK_BACK_UP = [
	{
		id: "living-room",
		title: "Living room",
		subtitle: "Edited 2h ago",
		description:
			"Warm wood, low light, soft wool. Trying to land somewhere between cabin and gallery.",
		source: "https://picsum.photos/id/1018/1000/1000",
	},
	{
		id: "fall-fits",
		title: "Fall fits",
		subtitle: "Yesterday",
		description:
			"Layering ideas before the weather actually commits — heavy on knit, light on logos.",
		source: "https://picsum.photos/id/1025/1000/1000",
	},
	{
		id: "trip-planning",
		title: "Trip planning",
		subtitle: "Mon · Lisbon",
		description:
			"Notes for a slow week in Lisbon — tiles, pastéis, the cheap café with the good view.",
		source: "https://picsum.photos/id/1043/1000/1000",
	},
	{
		id: "studio-walls",
		title: "Studio walls",
		subtitle: "Sat",
		description:
			"Neutral with one risky color. Collecting hung-work shots while I decide on paint.",
		source: "https://picsum.photos/id/1059/1000/1000",
	},
	{
		id: "garden-plan",
		title: "Garden plan",
		subtitle: "Apr 28",
		description:
			"What survived last year, what to swap, what to actually finish. Beans, peas, the failed dahlia experiment.",
		source: "https://picsum.photos/id/1074/1000/1000",
	},
] satisfies BoardItem[];

const TEMPLATES = [
	{
		id: "warm-low",
		title: "Mood: warm + low",
		subtitle: "Starter",
		description: "A starting palette for cozy, low-light interiors.",
		source: "https://picsum.photos/id/1019/1000/1000",
	},
	{
		id: "lookbook",
		title: "Fashion lookbook",
		subtitle: "Starter",
		description: "Season-by-season outfit references, kept loose.",
		source: "https://picsum.photos/id/1029/1000/1000",
	},
	{
		id: "trip-board",
		title: "Trip board",
		subtitle: "Starter",
		description: "Places to eat, walks to take, neighborhoods to wander.",
		source: "https://picsum.photos/id/1045/1000/1000",
	},
	{
		id: "color-study",
		title: "Color study",
		subtitle: "Starter",
		description: "One color and every surface it shows up on.",
		source: "https://picsum.photos/id/1062/1000/1000",
	},
	{
		id: "wedding-palette",
		title: "Wedding palette",
		subtitle: "Starter",
		description: "Florals, fabrics, tablescapes — one shared reference.",
		source: "https://picsum.photos/id/1071/1000/1000",
	},
	{
		id: "photo-direction",
		title: "Photo direction",
		subtitle: "Starter",
		description: "References for a single shoot — light, framing, mood.",
		source: "https://picsum.photos/id/1084/1000/1000",
	},
] satisfies BoardItem[];

function openDetail(stackType: string, tag: string, item: BoardItem) {
	router.push({
		pathname: buildStackPath(stackType, "bounds/style-id/[id]") as never,
		params: {
			id: tag,
			image: item.source,
			title: item.title,
			subtitle: item.subtitle,
			description: item.description,
		},
	});
}

const GRID_HORIZONTAL_PADDING = 16;
const GRID_COLUMN_GAP = 16;
const GRID_COLUMNS = 2;

export default function StyleIdBoundsIndex() {
	const stackType = useResolvedStackType();
	const theme = useTheme();
	const insets = useSafeAreaInsets();
	const { width: windowWidth } = useWindowDimensions();
	const gridCellWidth = Math.floor(
		(windowWidth -
			GRID_HORIZONTAL_PADDING * 2 -
			GRID_COLUMN_GAP * (GRID_COLUMNS - 1)) /
			GRID_COLUMNS,
	);
	return (
		<View
			style={[
				styles.container,
				{
					backgroundColor: theme.bg,
					paddingTop: insets.top,
				},
			]}
		>
			<ScreenHeader
				title="My Boards"
				subtitle="Visual notes, kept loose"
			/>
			<ScrollView
				style={styles.content}
				contentContainerStyle={{ paddingBottom: insets.bottom }}
			>
				<View style={styles.grid}>
					{BOARDS.map((item) => {
						const tag = `shared-image-${item.id}`;
						return (
							<Transition.Boundary.Trigger
								key={tag}
								testID={tag}
								style={[styles.gridCell, { width: gridCellWidth }]}
								onPress={() => openDetail(stackType, tag, item)}
								id={tag}
							>
								<Transition.Boundary.Target
									style={[styles.cover, { backgroundColor: theme.card }]}
								>
									<Image
										source={item.source}
										style={styles.image}
										contentFit="cover"
									/>
									<View style={styles.heartBadge}>
										<Text style={styles.heartIcon}>♥</Text>
									</View>
								</Transition.Boundary.Target>
								<View style={styles.cardMeta}>
									<Text style={[styles.cardTitle, { color: theme.text }]}>
										{item.title}
									</Text>
									<Text
										style={[
											styles.cardSubtitle,
											{ color: theme.textSecondary },
										]}
									>
										{item.subtitle}
									</Text>
								</View>
							</Transition.Boundary.Trigger>
						);
					})}
				</View>
				<View style={styles.pickSection}>
					<View style={styles.pickHeader}>
						<Text style={[styles.pickTitle, { color: theme.text }]}>
							Pick back up
						</Text>
						<Text style={[styles.pickSeeAll, { color: theme.textSecondary }]}>
							See all
						</Text>
					</View>
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={[styles.pickScroll, { overflow: "visible" }]}
					>
						{PICK_BACK_UP.map((item) => {
							const tag = `shared-image-${item.id}`;
							return (
								<View key={tag} style={styles.pickCell}>
									<Transition.Boundary.Trigger
										testID={tag}
										id={tag}
										style={styles.pickBoundary}
										onPress={() => openDetail(stackType, tag, item)}
									>
										<Transition.Boundary.Target
											style={[styles.pickCover, { backgroundColor: theme.card }]}
										>
											<Image
												source={item.source}
												style={styles.image}
												contentFit="cover"
											/>
										</Transition.Boundary.Target>
									</Transition.Boundary.Trigger>
									<View style={styles.pickMeta}>
										<Text style={[styles.pickItemTitle, { color: theme.text }]}>
											{item.title}
										</Text>
										<Text
											style={[
												styles.pickItemSubtitle,
												{ color: theme.textSecondary },
											]}
										>
											{item.subtitle}
										</Text>
									</View>
								</View>
							);
						})}
					</ScrollView>
				</View>
				<View style={styles.trySection}>
					<View style={styles.tryHeader}>
						<Text style={[styles.tryTitle, { color: theme.text }]}>
							Try these out
						</Text>
						<Text style={[styles.trySeeAll, { color: theme.textSecondary }]}>
							Browse all
						</Text>
					</View>
					{TEMPLATES.map((item) => {
						const tag = `shared-image-${item.id}`;
						return (
							<Transition.Boundary.Trigger
								key={tag}
								testID={tag}
								id={tag}
								style={styles.tryRow}
								onPress={() => openDetail(stackType, tag, item)}
							>
								<Transition.Boundary.Target
									style={[styles.tryCover, { backgroundColor: theme.card }]}
								>
									<Image
										source={item.source}
										style={styles.image}
										contentFit="cover"
									/>
								</Transition.Boundary.Target>
								<View style={styles.tryText}>
									<Text style={[styles.tryItemTitle, { color: theme.text }]}>
										{item.title}
									</Text>
									<Text
										numberOfLines={2}
										style={[
											styles.tryItemDescription,
											{ color: theme.textSecondary },
										]}
									>
										{item.description}
									</Text>
								</View>
								<Ionicons
									name="chevron-forward"
									size={20}
									color={theme.textTertiary}
								/>
							</Transition.Boundary.Trigger>
						);
					})}
				</View>
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
		padding: 16,
	},
	grid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 16,
		marginTop: 16,
	},
	gridCell: {
		gap: 10,
	},
	cover: {
		width: "100%",
		aspectRatio: 1,
		borderRadius: 24,
		borderCurve: "continuous",
		overflow: "hidden",
	},
	image: {
		width: "100%",
		height: "100%",
	},
	heartBadge: {
		position: "absolute",
		top: 12,
		right: 12,
		width: 32,
		height: 32,
		borderRadius: 16,
		backgroundColor: "rgba(0,0,0,0.4)",
		justifyContent: "center",
		alignItems: "center",
	},
	heartIcon: {
		color: "white",
		fontSize: 16,
	},
	cardMeta: {
		paddingHorizontal: 2,
		gap: 2,
	},
	cardTitle: {
		fontSize: 17,
		fontWeight: "600",
	},
	cardSubtitle: {
		fontSize: 14,
	},
	pickSection: {
		marginTop: 32,
		marginHorizontal: -16,
		overflow: "visible",
		position: "relative",
		zIndex: 20,
		elevation: 20,
	},
	pickHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: 16,
		marginBottom: 12,
	},
	pickTitle: {
		fontSize: 22,
		fontWeight: "600",
		letterSpacing: -0.3,
	},
	pickSeeAll: {
		fontSize: 15,
		fontWeight: "500",
	},
	pickScroll: {
		paddingHorizontal: 16,
		gap: 14,
		overflow: "visible",
	},
	pickCell: {
		width: 140,
		gap: 10,
	},
	pickBoundary: {
		width: 140,
		height: 140,
		overflow: "visible",
		position: "relative",
		zIndex: 50,
		elevation: 50,
	},
	pickCover: {
		width: 140,
		height: 140,
		borderRadius: 28,
		borderCurve: "continuous",
		overflow: "hidden",
	},
	pickMeta: {
		paddingHorizontal: 2,
		gap: 2,
	},
	pickItemTitle: {
		fontSize: 15,
		fontWeight: "600",
	},
	pickItemSubtitle: {
		fontSize: 13,
	},
	trySection: {
		marginTop: 32,
	},
	tryHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 8,
	},
	tryTitle: {
		fontSize: 22,
		fontWeight: "600",
		letterSpacing: -0.3,
	},
	trySeeAll: {
		fontSize: 15,
		fontWeight: "500",
	},
	tryRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 16,
		paddingVertical: 14,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: "rgba(142,142,147,0.28)",
	},
	tryCover: {
		width: 72,
		height: 72,
		borderRadius: 18,
		borderCurve: "continuous",
		overflow: "hidden",
	},
	tryText: {
		flex: 1,
		gap: 4,
	},
	tryItemTitle: {
		fontSize: 18,
		fontWeight: "600",
	},
	tryItemDescription: {
		fontSize: 14,
		lineHeight: 19,
	},
});
