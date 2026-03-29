import { Image } from "expo-image";
import { router } from "expo-router";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { useTheme } from "@/theme";
import {
	GRID_LAYOUT,
	type LayoutRow,
	ZOOM_ID_ITEMS,
	type ZoomIdItem,
} from "./constants";

const GAP = 10;
const PADDING = 20;

function getItemById(id: string) {
	return ZOOM_ID_ITEMS.find((item) => item.id === id)!;
}

function CardOverlay({ item }: { item: ZoomIdItem }) {
	return (
		<View style={styles.overlay}>
			<Text style={styles.cardTitle} numberOfLines={1}>
				{item.title}
			</Text>
			<Text style={styles.cardSubtitle} numberOfLines={1}>
				{item.location}
			</Text>
		</View>
	);
}

function BannerRow({
	row,
	contentWidth,
}: {
	row: Extract<LayoutRow, { type: "banner" }>;
	contentWidth: number;
}) {
	const stackType = useResolvedStackType();
	const item = getItemById(row.itemId);
	const height = contentWidth / item.aspectRatio;

	return (
		<Transition.Boundary.Trigger
			id={item.id}
			scaleMode="uniform"
			anchor="top"
			onPress={() =>
				router.push(
					buildStackPath(stackType, `bounds/zoom-id/${item.id}`) as never,
				)
			}
			style={[styles.card, { width: contentWidth, height }]}
		>
			<Image
				source={item.image}
				style={StyleSheet.absoluteFill}
				contentFit="cover"
			/>
			<CardOverlay item={item} />
		</Transition.Boundary.Trigger>
	);
}

function PairRow({
	row,
	contentWidth,
}: {
	row: Extract<LayoutRow, { type: "pair" }>;
	contentWidth: number;
}) {
	const stackType = useResolvedStackType();
	const cellWidth = (contentWidth - GAP) / 2;

	return (
		<View style={styles.row}>
			{row.itemIds.map((id) => {
				const item = getItemById(id);
				return (
					<Transition.Boundary.Trigger
						key={item.id}
						id={item.id}
						scaleMode="uniform"
						anchor="top"
						onPress={() =>
							router.push(
								buildStackPath(stackType, `bounds/zoom-id/${item.id}`) as never,
							)
						}
						style={[styles.card, { width: cellWidth, height: cellWidth }]}
					>
						<Image
							source={item.image}
							style={StyleSheet.absoluteFill}
							contentFit="cover"
						/>
						<CardOverlay item={item} />
					</Transition.Boundary.Trigger>
				);
			})}
		</View>
	);
}

function TripleRow({
	row,
	contentWidth,
}: {
	row: Extract<LayoutRow, { type: "triple" }>;
	contentWidth: number;
}) {
	const stackType = useResolvedStackType();
	const cellWidth = (contentWidth - GAP * 2) / 3;
	const cellHeight = cellWidth * 1.5;

	return (
		<View style={styles.row}>
			{row.itemIds.map((id) => {
				const item = getItemById(id);
				return (
					<Transition.Boundary.Trigger
						key={item.id}
						id={item.id}
						scaleMode="uniform"
						anchor="top"
						onPress={() =>
							router.push(
								buildStackPath(stackType, `bounds/zoom-id/${item.id}`) as never,
							)
						}
						style={[styles.card, { width: cellWidth, height: cellHeight }]}
					>
						<Image
							source={item.image}
							style={StyleSheet.absoluteFill}
							contentFit="cover"
						/>
						<CardOverlay item={item} />
					</Transition.Boundary.Trigger>
				);
			})}
		</View>
	);
}

function GridRow({
	row,
	contentWidth,
}: {
	row: LayoutRow;
	contentWidth: number;
}) {
	switch (row.type) {
		case "banner":
			return <BannerRow row={row} contentWidth={contentWidth} />;
		case "pair":
			return <PairRow row={row} contentWidth={contentWidth} />;
		case "triple":
			return <TripleRow row={row} contentWidth={contentWidth} />;
	}
}

export default function NavigationZoomIdIndex() {
	const { width } = useWindowDimensions();
	const insets = useSafeAreaInsets();
	const theme = useTheme();
	const contentWidth = width - PADDING * 2;

	return (
		<View style={[styles.container, { backgroundColor: theme.bg }]}>
			<View style={{ paddingTop: insets.top }}>
				<ScreenHeader
					title="Navigation Zoom ID Transition"
					subtitle="bounds({ id }).navigation.zoom()"
				/>
			</View>

			<Transition.ScrollView
				contentContainerStyle={[
					styles.scrollContent,
					{
						paddingBottom: insets.bottom + 24,
						zIndex: 1,
						paddingTop: insets.top,
					},
				]}
				style={{ zIndex: 1 }}
				showsVerticalScrollIndicator={false}
			>
				{GRID_LAYOUT.map((row, i) => (
					<GridRow key={i} row={row} contentWidth={contentWidth} />
				))}
			</Transition.ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollContent: {
		paddingHorizontal: PADDING,
		gap: GAP,
	},
	row: {
		flexDirection: "row",
		gap: GAP,
	},
	card: {
		borderRadius: 16,
		overflow: "hidden",
	},
	overlay: {
		...StyleSheet.absoluteFillObject,
		justifyContent: "flex-end",
		padding: 12,
		backgroundColor: "rgba(0,0,0,0.25)",
	},
	cardTitle: {
		color: "#fff",
		fontSize: 15,
		fontWeight: "700",
		letterSpacing: -0.2,
	},
	cardSubtitle: {
		color: "rgba(255,255,255,0.6)",
		fontSize: 11,
		fontWeight: "500",
		marginTop: 1,
	},
});
