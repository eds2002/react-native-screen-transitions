import { Image } from "expo-image";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { ZOOM_ID_ITEMS, type ZoomIdItem } from "./constants";

function ZoomIdCard({ item }: { item: ZoomIdItem }) {
	const stackType = useResolvedStackType();

	return (
		<Transition.Boundary
			id={item.id}
			mode="source"
			scaleMode="uniform"
			anchor="top"
			style={styles.card}
			key={item.id}
		>
			<Pressable
				onPress={() =>
					router.push(
						buildStackPath(stackType, `bounds/zoom-id/${item.id}`) as never,
					)
				}
				style={styles.cardPressable}
			>
				<Image
					source={item.image}
					style={styles.cardImage}
					contentFit="cover"
				/>
				<View style={styles.cardGradient}>
					<View style={styles.cardTextContainer}>
						<Text style={styles.cardTitle}>{item.title}</Text>
						<Text style={styles.cardSubtitle}>{item.subtitle}</Text>
					</View>
					<View style={styles.cardMeta}>
						<Text style={styles.cardLocation}>{item.location}</Text>
					</View>
				</View>
			</Pressable>
		</Transition.Boundary>
	);
}

export default function NavigationZoomIdIndex() {
	const insets = useSafeAreaInsets();

	return (
		<View style={styles.container}>
			<View style={{ paddingTop: insets.top }}>
				<ScreenHeader
					title="Navigation Zoom ID Transition"
					subtitle="bounds({ id }).navigation.zoom()"
				/>
			</View>

			<Transition.ScrollView
				contentContainerStyle={[
					styles.scrollContent,
					{ paddingBottom: insets.bottom + 24 },
				]}
				showsVerticalScrollIndicator={false}
			>
				{ZOOM_ID_ITEMS.map((item) => (
					<ZoomIdCard key={item.id} item={item} />
				))}
			</Transition.ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#0A0A0A",
	},
	scrollContent: {
		paddingHorizontal: 20,
		gap: 16,
	},
	card: {
		borderRadius: 20,
		overflow: "hidden",
	},
	cardPressable: {
		height: 220,
		borderRadius: 20,
		overflow: "hidden",
	},
	cardImage: {
		...StyleSheet.absoluteFillObject,
	},
	cardGradient: {
		flex: 1,
		justifyContent: "flex-end",
		padding: 18,
		backgroundColor: "rgba(0,0,0,0.15)",
	},
	cardTextContainer: {
		gap: 2,
	},
	cardTitle: {
		color: "#fff",
		fontSize: 22,
		fontWeight: "700",
		letterSpacing: -0.3,
	},
	cardSubtitle: {
		color: "rgba(255,255,255,0.7)",
		fontSize: 13,
		fontWeight: "500",
	},
	cardMeta: {
		flexDirection: "row",
		alignItems: "center",
		marginTop: 8,
	},
	cardLocation: {
		color: "rgba(255,255,255,0.5)",
		fontSize: 11,
		fontWeight: "600",
		textTransform: "uppercase",
		letterSpacing: 0.8,
	},
});
