import { Image } from "expo-image";
import { router } from "expo-router";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { useTheme } from "@/theme";
import { NESTED_BOUNDS_ITEMS } from "./constants";

const GRID_PADDING = 16;
const GRID_GAP = 10;

export default function NestedBoundsExampleIndex() {
	const stackType = useResolvedStackType();
	const { width } = useWindowDimensions();
	const cellSize = (width - GRID_PADDING * 2 - GRID_GAP) / 2;
	const theme = useTheme();

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={["top"]}>
			<ScreenHeader
				title="Nested Bounds A/B"
				subtitle="Pick a destination to preview shared zoom into a nested flow"
			/>

			<View style={[styles.descriptionCard, { backgroundColor: theme.infoBox }]}>
				<Text style={[styles.descriptionTitle, { color: theme.infoBoxLabel }]}>Mini Travel Flow</Text>
				<Text style={[styles.descriptionBody, { color: theme.textSecondary }]}>
					Open any destination tile, then move between Overview and Day Plan in
					the nested route.
				</Text>
			</View>

			<View style={styles.grid}>
				{NESTED_BOUNDS_ITEMS.map((item) => (
					<Transition.Boundary.Pressable
						key={item.id}
						id={item.id}
						scaleMode="uniform"
						anchor="center"
						style={[styles.card, { width: cellSize, height: cellSize }]}
						onPress={() =>
							router.push(
								buildStackPath(
									stackType,
									`bounds/example/${item.id}/a`,
								) as never,
							)
						}
					>
						<Image
							source={item.image}
							style={styles.image}
							contentFit="cover"
						/>
						<View style={styles.overlay}>
							<View
								style={[
									styles.locationPill,
									{ borderColor: `${item.accent}AA` },
								]}
							>
								<Text style={styles.locationText}>{item.location}</Text>
							</View>
							<Text style={styles.title}>{item.title}</Text>
							<Text style={styles.subtitle}>{item.subtitle}</Text>
						</View>
					</Transition.Boundary.Pressable>
				))}
			</View>

			<View style={[styles.noteCard, { backgroundColor: theme.noteBox }]}>
				<Text style={[styles.noteTitle, { color: theme.noteText }]}>Flow</Text>
				<Text style={[styles.noteBody, { color: theme.textSecondary }]}>
					Grid card to nested Overview, then switch to Day Plan.
				</Text>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: GRID_PADDING,
	},
	descriptionCard: {
		marginTop: 8,
		marginBottom: 12,
		padding: 14,
		borderRadius: 14,
	},
	descriptionTitle: {
		fontSize: 13,
		fontWeight: "700",
		textTransform: "uppercase",
		letterSpacing: 0.9,
	},
	descriptionBody: {
		marginTop: 6,
		fontSize: 13,
		lineHeight: 20,
	},
	grid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: GRID_GAP,
	},
	card: {
		borderRadius: 16,
		overflow: "hidden",
	},
	image: {
		...StyleSheet.absoluteFillObject,
	},
	overlay: {
		flex: 1,
		justifyContent: "flex-end",
		padding: 10,
		backgroundColor: "rgba(0,0,0,0.25)",
	},
	locationPill: {
		alignSelf: "flex-start",
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 10,
		backgroundColor: "rgba(0,0,0,0.35)",
		marginBottom: 8,
	},
	locationText: {
		fontSize: 10,
		fontWeight: "700",
		letterSpacing: 0.4,
		textTransform: "uppercase",
		color: "#EAF1FA",
	},
	title: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "700",
	},
	subtitle: {
		marginTop: 2,
		color: "rgba(255,255,255,0.85)",
		fontSize: 11,
	},
	noteCard: {
		marginTop: 14,
		padding: 14,
		borderRadius: 14,
	},
	noteTitle: {
		fontSize: 12,
		fontWeight: "700",
		textTransform: "uppercase",
		letterSpacing: 0.8,
	},
	noteBody: {
		marginTop: 4,
		fontSize: 13,
		lineHeight: 19,
	},
});
