import { Image } from "expo-image";
import { router } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import {
	NESTED_ZOOM_ID_ITEMS,
	type NestedZoomIdItem,
} from "./constants";
import { useTheme } from "@/theme";

function NestedZoomIdCard({ item }: { item: NestedZoomIdItem }) {
	const stackType = useResolvedStackType();

	return (
		<Transition.Boundary.Trigger
			id={item.id}
			scaleMode="uniform"
			anchor="top"
			onPress={() =>
				router.push(
					buildStackPath(stackType, `bounds/zoom-id-nested/${item.id}`) as never,
				)
			}
			style={styles.card}
		>
			<Image source={item.image} style={styles.cardImage} contentFit="cover" />
			<View style={styles.cardOverlay}>
				<View style={styles.cardCopy}>
					<Text style={styles.cardTitle}>{item.title}</Text>
					<Text style={styles.cardSubtitle}>{item.subtitle}</Text>
				</View>
				<View style={styles.metaRow}>
					<Text style={styles.metaText}>{item.location}</Text>
					<Text style={styles.metaDot}>•</Text>
					<Text style={styles.metaText}>{item.stay}</Text>
				</View>
			</View>
		</Transition.Boundary.Trigger>
	);
}

export default function NestedNavigationZoomIdIndex() {
	const insets = useSafeAreaInsets();
	const theme = useTheme();

	return (
		<View style={[styles.container, { backgroundColor: theme.bg }]}>
			<View style={{ paddingTop: insets.top }}>
				<ScreenHeader
					title="Nested Navigation Zoom ID"
					subtitle="Open a card, then push the same detail route again from inside dst"
				/>
			</View>

			<View style={[styles.descriptionCard, { backgroundColor: theme.infoBox }]}>
				<Text style={[styles.descriptionTitle, { color: theme.infoBoxLabel }]}>What this tests</Text>
				<Text style={[styles.descriptionBody, { color: theme.textSecondary }]}>
					This is the same id-only navigation zoom pattern as `zoom-id`, but the
					detail screen includes related cards that push the exact same `[id]`
					route again with new data.
				</Text>
			</View>

			<Transition.ScrollView
				contentContainerStyle={[
					styles.scrollContent,
					{ paddingBottom: insets.bottom + 24 },
				]}
				showsVerticalScrollIndicator={false}
			>
				{NESTED_ZOOM_ID_ITEMS.map((item) => (
					<NestedZoomIdCard key={item.id} item={item} />
				))}
			</Transition.ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	descriptionCard: {
		marginHorizontal: 20,
		marginBottom: 14,
		padding: 16,
		borderRadius: 14,
	},
	descriptionTitle: {
		fontSize: 12,
		fontWeight: "700",
		textTransform: "uppercase",
		letterSpacing: 0.9,
	},
	descriptionBody: {
		marginTop: 6,
		fontSize: 14,
		lineHeight: 21,
	},
	scrollContent: {
		paddingHorizontal: 20,
		gap: 16,
	},
	card: {
		height: 218,
		borderRadius: 22,
		overflow: "hidden",
	},
	cardImage: {
		...StyleSheet.absoluteFillObject,
	},
	cardOverlay: {
		flex: 1,
		justifyContent: "flex-end",
		padding: 18,
		backgroundColor: "rgba(0,0,0,0.2)",
	},
	cardCopy: {
		gap: 3,
	},
	cardTitle: {
		color: "#fff",
		fontSize: 24,
		fontWeight: "800",
		letterSpacing: -0.4,
	},
	cardSubtitle: {
		color: "rgba(255,255,255,0.76)",
		fontSize: 13,
		fontWeight: "500",
	},
	metaRow: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 10,
	},
	metaText: {
		color: "rgba(255,255,255,0.56)",
		fontSize: 11,
		fontWeight: "600",
		textTransform: "uppercase",
		letterSpacing: 0.8,
	},
	metaDot: {
		marginHorizontal: 6,
		color: "rgba(255,255,255,0.4)",
	},
});
