import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import { getZoomIdItemById } from "./constants";
import { useTheme } from "@/theme";

export default function NavigationZoomIdDetail() {
	const { width } = useWindowDimensions();
	const insets = useSafeAreaInsets();
	const { id } = useLocalSearchParams<{ id?: string }>();
	const item = getZoomIdItemById(id);
	const imageWidth = width - 40;
	const imageHeight = imageWidth / item.aspectRatio;
	const theme = useTheme();

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
					<Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
					<Text style={[styles.subtitle, { color: theme.textSecondary }]}>{item.subtitle}</Text>
					<Text style={[styles.body, { color: theme.textSecondary }]}>{item.description}</Text>
				</View>

				<View style={styles.metaGrid}>
					<View style={[styles.metaItem, { backgroundColor: theme.surface }]}>
						<Text style={[styles.metaLabel, { color: theme.textTertiary }]}>Location</Text>
						<Text style={[styles.metaValue, { color: theme.text }]}>{item.location}</Text>
					</View>
					<View style={[styles.metaItem, { backgroundColor: theme.surface }]}>
						<Text style={[styles.metaLabel, { color: theme.textTertiary }]}>Lens</Text>
						<Text style={[styles.metaValue, { color: theme.text }]}>{item.camera}</Text>
					</View>
				</View>

				<View style={[styles.noteCard, { backgroundColor: theme.surface }]}>
					<Text style={[styles.noteTitle, { color: theme.textTertiary }]}>About This Transition</Text>
					<Text style={[styles.noteText, { color: theme.textSecondary }]}>
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
		letterSpacing: -0.5,
	},
	subtitle: {
		fontSize: 14,
		fontWeight: "500",
	},
	body: {
		fontSize: 15,
		lineHeight: 24,
		marginTop: 8,
	},
	metaGrid: {
		flexDirection: "row",
		gap: 12,
	},
	metaItem: {
		flex: 1,
		borderRadius: 16,
		padding: 16,
		gap: 6,
	},
	metaLabel: {
		fontSize: 11,
		fontWeight: "600",
		textTransform: "uppercase",
		letterSpacing: 0.8,
	},
	metaValue: {
		fontSize: 16,
		fontWeight: "700",
	},
	noteCard: {
		borderRadius: 18,
		padding: 18,
		gap: 8,
	},
	noteTitle: {
		fontSize: 13,
		fontWeight: "700",
		textTransform: "uppercase",
		letterSpacing: 1,
	},
	noteText: {
		fontSize: 14,
		lineHeight: 22,
	},
});
