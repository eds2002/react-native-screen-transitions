import { Ionicons } from "@expo/vector-icons";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const MAX_SNAP = 0.8;
const MAX_WIDTH = SCREEN_WIDTH * MAX_SNAP;

const PHOTOS = Array.from({ length: 24 }, (_, i) => ({
	id: i + 1,
	color: [
		"#E84393",
		"#6C5CE7",
		"#00B894",
		"#FDCB6E",
		"#74B9FF",
		"#FF6B6B",
		"#A29BFE",
		"#FD79A8",
		"#55EFC4",
		"#FFEAA7",
		"#DFE6E9",
		"#B2BEC3",
	][i % 12],
}));

const ALBUMS = [
	{ name: "Recents", count: 2847, color: "#6C5CE7" },
	{ name: "Favorites", count: 312, color: "#E84393" },
	{ name: "Screenshots", count: 891, color: "#00B894" },
];

export default function WithScrollHorizontalScreen() {
	const insets = useSafeAreaInsets();

	return (
		<View style={[styles.container, { maxWidth: MAX_WIDTH }]}>
			{/* Vertical handle on left edge */}
			<View style={styles.handleBar}>
				<View style={styles.handle} />
			</View>

			<View style={[styles.content, { paddingTop: insets.top + 12 }]}>
				<Text style={styles.title}>Photos</Text>
				<Text style={styles.subtitle}>Select media to share</Text>

				{/* Albums */}
				<Transition.ScrollView
					horizontal
					style={styles.albumScroll}
					contentContainerStyle={styles.albumContent}
					showsHorizontalScrollIndicator={false}
				>
					{ALBUMS.map((album) => (
						<View key={album.name} style={styles.albumCard}>
							<View
								style={[
									styles.albumThumb,
									{ backgroundColor: album.color + "20" },
								]}
							>
								<Ionicons name="images" size={24} color={album.color} />
							</View>
							<Text style={styles.albumName}>{album.name}</Text>
							<Text style={styles.albumCount}>{album.count}</Text>
						</View>
					))}
				</Transition.ScrollView>

				{/* Photo Grid */}
				<Text style={styles.sectionTitle}>All Photos</Text>
				<Transition.ScrollView
					style={styles.gridScroll}
					contentContainerStyle={styles.gridContent}
					showsVerticalScrollIndicator={false}
				>
					<View style={styles.grid}>
						{PHOTOS.map((photo) => (
							<View
								key={photo.id}
								style={[
									styles.photoCell,
									{ backgroundColor: photo.color + "25" },
								]}
							>
								<Ionicons name="image" size={24} color={photo.color} />
							</View>
						))}
					</View>
				</Transition.ScrollView>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		flexDirection: "row",
		backgroundColor: "#0D0D1A",
		borderTopLeftRadius: 28,
		borderBottomLeftRadius: 28,
	},
	handleBar: {
		width: 24,
		justifyContent: "center",
		alignItems: "center",
	},
	handle: {
		width: 5,
		height: 44,
		backgroundColor: "rgba(255,255,255,0.2)",
		borderRadius: 3,
	},
	content: {
		flex: 1,
		paddingRight: 16,
	},
	title: {
		fontSize: 28,
		fontWeight: "900",
		color: "#fff",
		marginBottom: 4,
		paddingLeft: 4,
	},
	subtitle: {
		fontSize: 14,
		fontWeight: "600",
		color: "rgba(255,255,255,0.35)",
		marginBottom: 20,
		paddingLeft: 4,
	},
	albumScroll: {
		flexGrow: 0,
		marginBottom: 20,
	},
	albumContent: {
		gap: 10,
		paddingLeft: 4,
	},
	albumCard: {
		backgroundColor: "rgba(255,255,255,0.06)",
		borderRadius: 18,
		padding: 14,
		width: 110,
		alignItems: "center",
		gap: 6,
	},
	albumThumb: {
		width: 52,
		height: 52,
		borderRadius: 16,
		justifyContent: "center",
		alignItems: "center",
	},
	albumName: {
		fontSize: 13,
		fontWeight: "800",
		color: "#fff",
	},
	albumCount: {
		fontSize: 12,
		fontWeight: "600",
		color: "rgba(255,255,255,0.3)",
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: "800",
		color: "rgba(255,255,255,0.5)",
		marginBottom: 12,
		paddingLeft: 4,
	},
	gridScroll: {
		flex: 1,
	},
	gridContent: {
		paddingBottom: 20,
		paddingLeft: 4,
	},
	grid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 6,
	},
	photoCell: {
		width: "31%",
		aspectRatio: 1,
		borderRadius: 14,
		justifyContent: "center",
		alignItems: "center",
	},
});
