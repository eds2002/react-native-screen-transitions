import { useLocalSearchParams } from "expo-router";
import { useCallback } from "react";
import type {
	ListRenderItemInfo,
	NativeScrollEvent,
	NativeSyntheticEvent,
} from "react-native";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import {
	activeZoomId,
	BOUNDS_SYNC_ZOOM_ITEMS,
	type BoundsSyncZoomItem,
	ZOOM_GROUP,
} from "../zoom.constants";

const COLOR_SWATCH_RADIUS = 28;

const COLOR_PROPERTIES = [
	{ label: "Hex", key: "hex" },
	{ label: "Hue", key: "hue" },
	{ label: "Saturation", key: "saturation" },
	{ label: "Lightness", key: "lightness" },
] as const;

function hexToHSL(hex: string) {
	const r = Number.parseInt(hex.slice(1, 3), 16) / 255;
	const g = Number.parseInt(hex.slice(3, 5), 16) / 255;
	const b = Number.parseInt(hex.slice(5, 7), 16) / 255;
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;
	if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
	const d = max - min;
	const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
	let h = 0;
	if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
	else if (max === g) h = ((b - r) / d + 2) / 6;
	else h = ((r - g) / d + 4) / 6;
	return {
		h: Math.round(h * 360),
		s: Math.round(s * 100),
		l: Math.round(l * 100),
	};
}

function getColorProperty(
	hex: string,
	key: (typeof COLOR_PROPERTIES)[number]["key"],
) {
	const hsl = hexToHSL(hex);
	switch (key) {
		case "hex":
			return hex.toUpperCase();
		case "hue":
			return `${hsl.h}\u00B0`;
		case "saturation":
			return `${hsl.s}%`;
		case "lightness":
			return `${hsl.l}%`;
	}
}

const PALETTES = [
	{ name: "Warm", colors: ["#FFB3BA", "#FFDFBA", "#FFFFBA", "#FFD1DC"] },
	{ name: "Cool", colors: ["#BAE1FF", "#BAFFC9", "#D4BAFF", "#BAF2FF"] },
	{ name: "Earth", colors: ["#C4A882", "#8B7355", "#D4C5A9", "#A0826D"] },
];

function DetailPage({
	item,
	width,
	insets,
}: {
	item: BoundsSyncZoomItem;
	width: number;
	insets: { top: number; bottom: number };
}) {
	const hsl = hexToHSL(item.color);

	return (
		<View style={[styles.page, { width, backgroundColor: item.bgColor }]}>
			<Transition.ScrollView
				style={styles.scrollView}
				contentContainerStyle={[
					styles.scrollContent,
					{
						paddingTop: insets.top + 20,
						paddingBottom: insets.bottom + 32,
					},
				]}
				showsVerticalScrollIndicator={false}
			>
				{/* Header */}
				<View style={styles.header}>
					<Text style={styles.title}>{item.title}</Text>
					<Text style={styles.subtitle}>{item.subtitle}</Text>
				</View>

				{/* Description */}
				<Text style={styles.description}>{item.description}</Text>

				{/* Color Swatch */}
				<View style={styles.swatchSection}>
					<Transition.Boundary
						id={item.id}
						group={ZOOM_GROUP}
						style={[styles.swatch, { backgroundColor: item.color }]}
					>
						<Text style={styles.swatchHex}>{item.color.toUpperCase()}</Text>
					</Transition.Boundary>
				</View>

				{/* Color Properties */}
				<View style={styles.propertiesGrid}>
					{COLOR_PROPERTIES.map((prop) => (
						<View
							key={prop.key}
							style={[
								styles.propertyCard,
								{ backgroundColor: `${item.color}15` },
							]}
						>
							<Text
								style={[styles.propertyLabel, { color: `${item.color}AA` }]}
							>
								{prop.label}
							</Text>
							<Text style={styles.propertyValue}>
								{getColorProperty(item.color, prop.key)}
							</Text>
						</View>
					))}
				</View>

				{/* HSL Bars */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>HSL Breakdown</Text>
					{[
						{ label: "Hue", value: hsl.h, max: 360 },
						{ label: "Saturation", value: hsl.s, max: 100 },
						{ label: "Lightness", value: hsl.l, max: 100 },
					].map((bar) => (
						<View key={bar.label} style={styles.barRow}>
							<Text style={styles.barLabel}>{bar.label}</Text>
							<View style={styles.barTrack}>
								<View
									style={[
										styles.barFill,
										{
											backgroundColor: item.color,
											width: `${(bar.value / bar.max) * 100}%`,
										},
									]}
								/>
							</View>
							<Text style={styles.barValue}>{bar.value}</Text>
						</View>
					))}
				</View>

				{/* Companion Palettes */}
				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Companion Palettes</Text>
					{PALETTES.map((palette) => (
						<View key={palette.name} style={styles.paletteRow}>
							<Text style={styles.paletteLabel}>{palette.name}</Text>
							<View style={styles.paletteSwatches}>
								{palette.colors.map((c) => (
									<View
										key={c}
										style={[styles.paletteSwatch, { backgroundColor: c }]}
									/>
								))}
							</View>
						</View>
					))}
				</View>

				{/* Usage Notes */}
				<View style={[styles.section, styles.notesCard]}>
					<Text style={styles.sectionTitle}>Usage Notes</Text>
					<Text style={styles.noteText}>
						This color works best as an accent against dark backgrounds. Pair
						with neutral greys for UI elements or use at reduced opacity for
						subtle surface tints. Avoid placing small text directly on this
						color without sufficient contrast.
					</Text>
					<View style={styles.noteTags}>
						{["Accent", "UI", "Vibrant", "Accessible"].map((tag) => (
							<View
								key={tag}
								style={[styles.noteTag, { backgroundColor: `${item.color}20` }]}
							>
								<Text style={[styles.noteTagText, { color: item.color }]}>
									{tag}
								</Text>
							</View>
						))}
					</View>
				</View>
			</Transition.ScrollView>
		</View>
	);
}

export default function BoundsSyncZoomDetail() {
	const { width } = useWindowDimensions();
	const { id } = useLocalSearchParams<{ id: string }>();
	const insets = useSafeAreaInsets();

	const initialIndex = Math.max(
		0,
		BOUNDS_SYNC_ZOOM_ITEMS.findIndex((item) => item.id === id),
	);

	const handleMomentumScrollEnd = useCallback(
		(event: NativeSyntheticEvent<NativeScrollEvent>) => {
			const offsetX = event.nativeEvent.contentOffset.x;
			const pageIndex = Math.round(offsetX / width);
			const item = BOUNDS_SYNC_ZOOM_ITEMS[pageIndex];

			if (!item) return;

			activeZoomId.value = item.id;
		},
		[width],
	);

	const getItemLayout = useCallback(
		(_: any, index: number) => ({
			length: width,
			offset: width * index,
			index,
		}),
		[width],
	);

	const renderItem = useCallback(
		({ item }: ListRenderItemInfo<BoundsSyncZoomItem>) => (
			<DetailPage item={item} width={width} insets={insets} />
		),
		[width, insets],
	);

	const keyExtractor = useCallback((item: BoundsSyncZoomItem) => item.id, []);

	return (
		<Animated.FlatList
			data={BOUNDS_SYNC_ZOOM_ITEMS}
			renderItem={renderItem}
			keyExtractor={keyExtractor}
			getItemLayout={getItemLayout}
			initialScrollIndex={initialIndex}
			horizontal
			pagingEnabled
			showsHorizontalScrollIndicator={false}
			onMomentumScrollEnd={handleMomentumScrollEnd}
			style={styles.flatList}
		/>
	);
}

const styles = StyleSheet.create({
	flatList: {
		flex: 1,
	},
	page: {
		flex: 1,
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		paddingHorizontal: 24,
	},
	header: {
		marginBottom: 16,
	},
	title: {
		fontSize: 32,
		fontWeight: "800",
		color: "#fff",
		letterSpacing: -0.8,
	},
	subtitle: {
		marginTop: 4,
		fontSize: 16,
		fontWeight: "500",
		color: "rgba(255,255,255,0.45)",
	},
	description: {
		fontSize: 15,
		lineHeight: 24,
		color: "rgba(255,255,255,0.55)",
		marginBottom: 24,
	},
	swatchSection: {
		marginBottom: 24,
	},
	swatch: {
		width: "100%",
		height: 180,
		borderRadius: COLOR_SWATCH_RADIUS,
		alignItems: "center",
		justifyContent: "flex-end",
		paddingBottom: 20,
	},
	swatchHex: {
		fontSize: 18,
		fontWeight: "700",
		color: "rgba(255,255,255,0.9)",
		letterSpacing: 2,
	},
	propertiesGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 10,
		marginBottom: 28,
	},
	propertyCard: {
		width: "47%",
		flexGrow: 1,
		borderRadius: 16,
		paddingVertical: 16,
		paddingHorizontal: 16,
		gap: 6,
	},
	propertyLabel: {
		fontSize: 11,
		fontWeight: "600",
		textTransform: "uppercase",
		letterSpacing: 0.8,
	},
	propertyValue: {
		fontSize: 20,
		fontWeight: "700",
		color: "#fff",
	},
	section: {
		marginBottom: 28,
	},
	sectionTitle: {
		fontSize: 13,
		fontWeight: "700",
		color: "rgba(255,255,255,0.35)",
		textTransform: "uppercase",
		letterSpacing: 1,
		marginBottom: 14,
	},
	barRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 12,
		gap: 12,
	},
	barLabel: {
		width: 80,
		fontSize: 13,
		fontWeight: "500",
		color: "rgba(255,255,255,0.5)",
	},
	barTrack: {
		flex: 1,
		height: 8,
		backgroundColor: "rgba(255,255,255,0.08)",
		borderRadius: 4,
		overflow: "hidden",
	},
	barFill: {
		height: "100%",
		borderRadius: 4,
	},
	barValue: {
		width: 36,
		fontSize: 13,
		fontWeight: "600",
		color: "rgba(255,255,255,0.6)",
		textAlign: "right",
	},
	paletteRow: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 14,
		gap: 14,
	},
	paletteLabel: {
		width: 80,
		fontSize: 13,
		fontWeight: "500",
		color: "rgba(255,255,255,0.5)",
	},
	paletteSwatches: {
		flexDirection: "row",
		gap: 8,
	},
	paletteSwatch: {
		width: 32,
		height: 32,
		borderRadius: 10,
	},
	notesCard: {
		backgroundColor: "rgba(255,255,255,0.04)",
		borderRadius: 20,
		padding: 20,
	},
	noteText: {
		fontSize: 14,
		lineHeight: 22,
		color: "rgba(255,255,255,0.45)",
		marginBottom: 16,
	},
	noteTags: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
	noteTag: {
		paddingHorizontal: 14,
		paddingVertical: 7,
		borderRadius: 10,
	},
	noteTagText: {
		fontSize: 12,
		fontWeight: "600",
	},
});
