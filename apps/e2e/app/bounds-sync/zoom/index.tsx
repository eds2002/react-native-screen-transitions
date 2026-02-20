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
import { BOUNDS_SYNC_ZOOM_ITEMS } from "../zoom.constants";

const GAP = 10;
const PADDING = 16;

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
					{BOUNDS_SYNC_ZOOM_ITEMS.map((item) => {
						const cardWidth = item.cols === 2 ? colWidth * 2 + GAP : colWidth;

						return (
							<Pressable
								key={item.id}
								onPress={() =>
									router.push(`/bounds-sync/zoom/${item.id}` as never)
								}
							>
								<Transition.Boundary
									id={item.id}
									role="source"
									style={[
										styles.card,
										{
											backgroundColor: item.color,
											width: cardWidth,
											height: item.height,
										},
									]}
								>
									<Text style={styles.title}>{item.title}</Text>
									<Text style={styles.subtitle}>{item.subtitle}</Text>
								</Transition.Boundary>
							</Pressable>
						);
					})}
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
	},
	grid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: GAP,
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
