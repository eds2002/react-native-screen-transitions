import { Image } from "expo-image";
import { router } from "expo-router";
import { ScrollView, StyleSheet, View } from "react-native";
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
								onPress={() => {
									router.push({
										pathname: buildStackPath(
											stackType,
											"bounds/style-id/[id]",
										) as never,
										params: {
											id: tag,
											image: item.source,
											title: item.title,
											subtitle: item.subtitle,
											description: item.description,
										},
									});
								}}
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
});
