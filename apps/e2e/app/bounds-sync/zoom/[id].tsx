import { useLocalSearchParams } from "expo-router";
import { useRef } from "react";
import type {
	NativeScrollEvent,
	NativeSyntheticEvent,
	ScrollView,
} from "react-native";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import {
	activeZoomId,
	BOUNDS_SYNC_ZOOM_ITEMS,
	ZOOM_GROUP,
} from "../zoom.constants";

const CARD_INSET = 16;
const CARD_RADIUS = 24;
export default function BoundsSyncZoomDetail() {
	const { width } = useWindowDimensions();
	const { id } = useLocalSearchParams<{ id: string }>();
	const insets = useSafeAreaInsets();
	const scrollRef = useRef<ScrollView>(null);

	const initialIndex = Math.max(
		0,
		BOUNDS_SYNC_ZOOM_ITEMS.findIndex((item) => item.id === id),
	);

	const cardWidth = width - CARD_INSET * 2;

	const handleMomentumScrollEnd = (
		event: NativeSyntheticEvent<NativeScrollEvent>,
	) => {
		const offsetX = event.nativeEvent.contentOffset.x;
		const pageIndex = Math.round(offsetX / width);
		const item = BOUNDS_SYNC_ZOOM_ITEMS[pageIndex];

		if (!item) return;

		activeZoomId.value = item.id;
	};

	return (
		<Animated.ScrollView
			ref={scrollRef as any}
			horizontal
			pagingEnabled
			showsHorizontalScrollIndicator={false}
			contentOffset={{ x: initialIndex * width, y: 0 }}
			onMomentumScrollEnd={handleMomentumScrollEnd}
			style={styles.scrollView}
		>
			{BOUNDS_SYNC_ZOOM_ITEMS.map((item) => (
				<View
					key={item.id}
					style={[styles.page, { width, backgroundColor: item.bgColor }]}
				>
					{/* Inset card with rounded corners */}
					<Transition.Boundary
						group={ZOOM_GROUP}
						id={item.id}
						style={[
							styles.card,
							{
								width: cardWidth,
								backgroundColor: item.color,
								marginTop: insets.top + CARD_INSET,
							},
						]}
					/>

					{/* Content area */}
					<View style={styles.body}>
						<View style={styles.textSection}>
							<Text style={styles.title}>{item.title}</Text>
							<Text style={styles.subtitle}>{item.subtitle}</Text>
							<Text style={styles.description}>{item.description}</Text>
						</View>

						{/* Info grid */}
						<View style={styles.infoGrid}>
							<View style={styles.infoItem}>
								<Text style={styles.infoLabel}>Category</Text>
								<Text style={styles.infoValue}>Productivity</Text>
							</View>
							<View style={styles.infoItem}>
								<Text style={styles.infoLabel}>Size</Text>
								<Text style={styles.infoValue}>24 MB</Text>
							</View>
							<View style={styles.infoItem}>
								<Text style={styles.infoLabel}>Rating</Text>
								<Text style={styles.infoValue}>4.8</Text>
							</View>
							<View style={styles.infoItem}>
								<Text style={styles.infoLabel}>Age</Text>
								<Text style={styles.infoValue}>4+</Text>
							</View>
						</View>

						<View style={{ paddingBottom: insets.bottom + 16 }} />
					</View>
				</View>
			))}
		</Animated.ScrollView>
	);
}

const styles = StyleSheet.create({
	scrollView: {
		flex: 1,
	},
	page: {
		flex: 1,
		alignItems: "center",
	},
	card: {
		aspectRatio: 1,
		borderRadius: CARD_RADIUS,
	},
	body: {
		flex: 1,
		alignSelf: "stretch",
		paddingHorizontal: 24,
		paddingTop: 24,
		justifyContent: "space-between",
	},
	textSection: {
		gap: 8,
	},
	title: {
		fontSize: 28,
		fontWeight: "800",
		color: "#fff",
		letterSpacing: -0.5,
	},
	subtitle: {
		fontSize: 16,
		fontWeight: "600",
		color: "rgba(255,255,255,0.5)",
	},
	description: {
		marginTop: 4,
		fontSize: 15,
		lineHeight: 24,
		color: "rgba(255,255,255,0.3)",
	},
	infoGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 12,
	},
	infoItem: {
		width: "47%",
		backgroundColor: "rgba(255,255,255,0.06)",
		borderRadius: 14,
		paddingVertical: 14,
		paddingHorizontal: 16,
		gap: 4,
	},
	infoLabel: {
		fontSize: 12,
		fontWeight: "500",
		color: "rgba(255,255,255,0.35)",
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	infoValue: {
		fontSize: 17,
		fontWeight: "700",
		color: "rgba(255,255,255,0.85)",
	},
});
