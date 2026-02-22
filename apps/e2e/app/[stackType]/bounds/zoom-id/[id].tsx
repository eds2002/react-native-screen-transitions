import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import { getZoomIdItemById } from "./constants";

export default function NavigationZoomIdDetail() {
	const { width } = useWindowDimensions();
	const insets = useSafeAreaInsets();
	const { id } = useLocalSearchParams<{ id?: string }>();
	const item = getZoomIdItemById(id);
	const imageWidth = width - 40;
	const imageHeight = imageWidth / item.aspectRatio;

	return (
		<View style={[styles.container, { backgroundColor: item.bgColor }]}>
			<View style={{ paddingTop: insets.top }}>
				<ScreenHeader
					title="Navigation Zoom ID Transition"
					subtitle={item.title}
				/>
			</View>

			<Transition.ScrollView
				contentContainerStyle={[
					styles.content,
					{ paddingBottom: insets.bottom + 32 },
				]}
				showsVerticalScrollIndicator={false}
			>
				<Image
					source={item.image}
					style={[styles.hero, { width: imageWidth, height: imageHeight }]}
					contentFit="cover"
				/>

				<View style={styles.infoSection}>
					<Text style={styles.title}>{item.title}</Text>
					<Text style={styles.subtitle}>{item.subtitle}</Text>
					<Text style={styles.body}>{item.description}</Text>
				</View>

				<View style={styles.metaGrid}>
					<View style={styles.metaItem}>
						<Text style={styles.metaLabel}>Location</Text>
						<Text style={styles.metaValue}>{item.location}</Text>
					</View>
					<View style={styles.metaItem}>
						<Text style={styles.metaLabel}>Lens</Text>
						<Text style={styles.metaValue}>{item.camera}</Text>
					</View>
				</View>

				<View style={styles.noteCard}>
					<Text style={styles.noteTitle}>About This Transition</Text>
					<Text style={styles.noteText}>
						Each card has a unique ID and maps directly to one detail route. The
						boundary match is purely by id with no group coordination. Swipe in
						any direction to dismiss.
					</Text>
				</View>
			</Transition.ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		paddingHorizontal: 20,
		gap: 20,
	},
	hero: {
		borderRadius: 20,
		overflow: "hidden",
		alignSelf: "center",
	},
	infoSection: {
		gap: 6,
	},
	title: {
		fontSize: 28,
		fontWeight: "800",
		color: "#fff",
		letterSpacing: -0.5,
	},
	subtitle: {
		fontSize: 14,
		color: "rgba(255,255,255,0.5)",
		fontWeight: "500",
	},
	body: {
		fontSize: 15,
		lineHeight: 24,
		color: "rgba(255,255,255,0.75)",
		marginTop: 8,
	},
	metaGrid: {
		flexDirection: "row",
		gap: 12,
	},
	metaItem: {
		flex: 1,
		backgroundColor: "rgba(255,255,255,0.06)",
		borderRadius: 16,
		padding: 16,
		gap: 6,
	},
	metaLabel: {
		fontSize: 11,
		fontWeight: "600",
		color: "rgba(255,255,255,0.35)",
		textTransform: "uppercase",
		letterSpacing: 0.8,
	},
	metaValue: {
		fontSize: 16,
		fontWeight: "700",
		color: "#fff",
	},
	noteCard: {
		backgroundColor: "rgba(255,255,255,0.04)",
		borderRadius: 18,
		padding: 18,
		gap: 8,
	},
	noteTitle: {
		fontSize: 13,
		fontWeight: "700",
		color: "rgba(255,255,255,0.35)",
		textTransform: "uppercase",
		letterSpacing: 1,
	},
	noteText: {
		fontSize: 14,
		lineHeight: 22,
		color: "rgba(255,255,255,0.5)",
	},
});
