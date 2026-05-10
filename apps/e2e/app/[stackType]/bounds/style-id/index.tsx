import { Image } from "expo-image";
import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { useTheme } from "@/theme";

type StyleImageItem = {
	id: string;
	title: string;
	subtitle: string;
	description: string;
	source: string;
};

const IMAGES = [
	{
		id: "atlas",
		title: "Atlas Frame",
		subtitle: "Alpine light study",
		description:
			"Golden light settles across a quiet alpine lake, giving the transition a cleaner landscape subject with strong color and depth.",
		source: "https://picsum.photos/id/1011/1000/1000",
	},
	{
		id: "coast",
		title: "Coastline",
		subtitle: "Warm rock and open sky",
		description:
			"Layered sandstone and blue distance make the shared element easier to read while the mask closes back into the grid.",
		source: "https://picsum.photos/id/1016/1000/1000",
	},
	{
		id: "drift",
		title: "Drift",
		subtitle: "Soft water motion",
		description:
			"A long-exposure water scene with clear contrast between the bright flow and darker surrounding texture.",
		source: "https://picsum.photos/id/1039/1000/1000",
	},
	{
		id: "grain",
		title: "Grain Fields",
		subtitle: "Pastoral warmth",
		description:
			"Late afternoon grasses bring a calmer, warmer frame that still exposes crop and clipping issues clearly.",
		source: "https://picsum.photos/id/1040/1000/1000",
	},
	{
		id: "summit",
		title: "Summit Ridge",
		subtitle: "Panoramic mountain depth",
		description:
			"Layered ridgelines give the final close position a more obvious visual anchor than the old random image set.",
		source: "https://picsum.photos/id/1036/1000/1000",
	},
	{
		id: "canopy",
		title: "Canopy Light",
		subtitle: "Dappled forest tones",
		description:
			"Soft forest light gives the grid a darker, textured option for checking edge masking during dismissal.",
		source: "https://picsum.photos/id/1047/1000/1000",
	},
] satisfies StyleImageItem[];

const LIST_ITEMS = [
	{
		id: "field-notes",
		title: "Field Notes",
		subtitle: "Morning review",
		description:
			"A compact row source that checks how style-id bounds retarget from a small nested image into the same detail surface.",
		source: "https://picsum.photos/id/1056/1000/1000",
	},
	{
		id: "low-clouds",
		title: "Low Clouds",
		subtitle: "Weather pass",
		description:
			"A soft, muted frame for checking thumbnail-to-detail movement without changing the destination example.",
		source: "https://picsum.photos/id/1067/1000/1000",
	},
	{
		id: "city-cut",
		title: "City Cut",
		subtitle: "Evening route",
		description:
			"Sharper vertical contrast makes it easier to spot target measurement errors from a list row.",
		source: "https://picsum.photos/id/1076/1000/1000",
	},
	{
		id: "quiet-room",
		title: "Quiet Room",
		subtitle: "Interior study",
		description:
			"A smaller source element with surrounding text, useful for validating nested Boundary.Target behavior.",
		source: "https://picsum.photos/id/1080/1000/1000",
	},
] satisfies StyleImageItem[];

function openDetail(stackType: string, tag: string, item: StyleImageItem) {
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

export default function StyleIdBoundsIndex() {
	const stackType = useResolvedStackType();
	const theme = useTheme();
	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.bg }]}
			edges={["top"]}
		>
			<ScreenHeader
				title="Custom Bounds Mask"
				subtitle="Custom bounds styles for the navigation mask"
			/>
			<ScrollView style={styles.content}>
				<View style={styles.grid}>
					{IMAGES.map((item) => {
						const tag = `shared-image-${item.id}`;
						return (
							<Transition.Boundary.Trigger
								key={tag}
								testID={tag}
								id={tag}
								style={[styles.imageCell, { backgroundColor: theme.card }]}
								onPress={() => openDetail(stackType, tag, item)}
							>
								<Image
									source={item.source}
									style={styles.image}
									contentFit="cover"
								/>
							</Transition.Boundary.Trigger>
						);
					})}
				</View>
				<View style={styles.list}>
					{LIST_ITEMS.map((item) => {
						const tag = `shared-list-image-${item.id}`;
						return (
							<Transition.Boundary.Trigger
								key={tag}
								testID={tag}
								id={tag}
								style={styles.listRow}
								onPress={() => openDetail(stackType, tag, item)}
							>
								<Transition.Boundary.Target style={styles.listImageTarget}>
									<Image
										source={item.source}
										style={styles.image}
										contentFit="cover"
									/>
								</Transition.Boundary.Target>
								<View style={styles.listText}>
									<Text style={[styles.listTitle, { color: theme.text }]}>
										{item.title}
									</Text>
									<Text
										numberOfLines={2}
										style={[
											styles.listSubtitle,
											{ color: theme.textSecondary },
										]}
									>
										{item.subtitle}
									</Text>
								</View>
								<Text style={[styles.chevron, { color: theme.textTertiary }]}>
									&gt;
								</Text>
							</Transition.Boundary.Trigger>
						);
					})}
				</View>
			</ScrollView>
		</SafeAreaView>
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
		gap: 12,
		marginTop: 16,
	},
	imageCell: {
		width: "48%",
		aspectRatio: 1,
		borderRadius: 24,
		borderCurve: "continuous",
		overflow: "hidden",
	},
	image: {
		width: "100%",
		height: "100%",
	},
	list: {
		marginTop: 28,
		paddingBottom: 48,
	},
	listRow: {
		minHeight: 88,
		flexDirection: "row",
		alignItems: "center",
		gap: 16,
		paddingVertical: 12,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderBottomColor: "rgba(142,142,147,0.28)",
	},
	listImageTarget: {
		width: 64,
		height: 64,
		borderRadius: 14,
		borderCurve: "continuous",
		overflow: "hidden",
	},
	listText: {
		flex: 1,
		gap: 4,
	},
	listTitle: {
		fontSize: 20,
		fontWeight: "600",
	},
	listSubtitle: {
		fontSize: 14,
		lineHeight: 18,
	},
	chevron: {
		fontSize: 32,
		fontWeight: "300",
		marginRight: 2,
	},
});
