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

export default function BoundsSyncZoomIndex() {
	const { width } = useWindowDimensions();
	const gap = 12;
	const padding = 16;
	const cardSize = (width - padding * 2 - gap) / 2;

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title="Bounds Sync: Navigation Zoom"
				subtitle="bounds({ id }).navigation.zoom()"
			/>

			<Text style={styles.concernText}>
				Concern: Navigation transition, separate from element A/B interpolation
			</Text>

			<View style={[styles.grid, { paddingHorizontal: padding, gap }]}>
				{BOUNDS_SYNC_ZOOM_ITEMS.map((item) => (
					<Pressable
						key={item.id}
						onPress={() => router.push(`/bounds-sync/zoom/${item.id}` as never)}
					>
						<Transition.Boundary
							id={item.id}
							role="source"
							style={[
								styles.card,
								{
									backgroundColor: item.color,
									width: cardSize,
									height: cardSize,
								},
							]}
						>
							<Text style={styles.title}>{item.title}</Text>
							<Text style={styles.subtitle}>{item.subtitle}</Text>
						</Transition.Boundary>
					</Pressable>
				))}
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#121212",
	},
	concernText: {
		paddingHorizontal: 16,
		paddingBottom: 12,
		fontSize: 11,
		color: "#7fa5cf",
		fontFamily: "monospace",
	},
	grid: {
		flexDirection: "row",
		flexWrap: "wrap",
		paddingBottom: 24,
	},
	card: {
		borderRadius: 24,
		padding: 16,
		justifyContent: "flex-end",
		overflow: "hidden",
	},
	title: {
		color: "#fff",
		fontSize: 21,
		fontWeight: "700",
	},
	subtitle: {
		marginTop: 4,
		color: "rgba(255,255,255,0.86)",
		fontSize: 13,
		fontWeight: "500",
	},
});
