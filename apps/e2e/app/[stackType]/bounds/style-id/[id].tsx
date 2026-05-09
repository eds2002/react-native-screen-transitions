import { useNavigation } from "@react-navigation/native";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef } from "react";
import type {
	ListRenderItemInfo,
	NativeScrollEvent,
	NativeSyntheticEvent,
	FlatList as RNFlatList,
} from "react-native";
import {
	Button,
	StyleSheet,
	Text,
	useWindowDimensions,
	View,
} from "react-native";
import Animated, {
	runOnUI,
	useAnimatedReaction,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Transition, {
	useScreenAnimation,
} from "react-native-screen-transitions";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { useTheme } from "@/theme";
import { BoundStore } from "../../../../../../packages/react-native-screen-transitions/src/shared/stores/bounds";
import {
	getStyleImageIndexByTag,
	STYLE_ID_GROUP,
	STYLE_ID_IMAGES,
	type StyleIdMode,
	type StyleImageItem,
	toStyleImageTag,
} from "./constants";

const DETAIL_ROWS = [
	"overview",
	"conditions",
	"timeline",
	"notes",
	"location",
	"metadata",
] as const;

function getRelatedStyleItems(id: string): StyleImageItem[] {
	const firstProbeItem = STYLE_ID_IMAGES[0];
	const secondProbeItem = STYLE_ID_IMAGES[1];

	return [id === firstProbeItem.id ? secondProbeItem : firstProbeItem];
}

function getRouteMode(mode: string | undefined): StyleIdMode {
	return mode === "single" ? "single" : "group";
}

function setBoundsGroupActiveId(group: string | undefined, id: string) {
	if (!group) return;

	runOnUI((nextGroup: string, nextId: string) => {
		"worklet";
		BoundStore.group.setActiveId(nextGroup, nextId);
	})(group, id);
}

function SharedImage({
	id,
	image,
	size,
	group,
}: {
	id: string;
	image: string;
	size: number;
	group?: string;
}) {
	const theme = useTheme();
	const insets = useSafeAreaInsets();
	return (
		<Transition.Boundary.View
			id={id}
			group={group}
			style={[
				styles.sharedImage,
				{
					width: size,
					height: size,
					backgroundColor: theme.card,
					marginTop: insets.top + 24,
				},
			]}
		>
			<Image source={image} style={styles.imageContent} contentFit="cover" />
		</Transition.Boundary.View>
	);
}

function DetailPage({
	item,
	width,
	group,
	mode,
}: {
	item: StyleImageItem;
	width: number;
	group?: string;
	mode: StyleIdMode;
}) {
	const imageSize = width * 0.8;
	const theme = useTheme();
	const stackType = useResolvedStackType();
	const tag = toStyleImageTag(item.id);
	const relatedItems = getRelatedStyleItems(item.id);

	return (
		<View style={[styles.page, { width }]}>
			<Transition.ScrollView
				contentContainerStyle={styles.scrollContent}
				style={[styles.scroll, { backgroundColor: theme.bg }]}
			>
				<SharedImage
					id={tag}
					image={item.source}
					size={imageSize}
					group={group}
				/>
				<Animated.View style={styles.section}>
					<View
						style={{
							width: "100%",
							gap: 6,
						}}
					>
						<Text style={[styles.kicker, { color: theme.textSecondary }]}>
							{item.subtitle}
						</Text>
						<Text style={[styles.title, { color: theme.text }]}>
							{item.title}
						</Text>
						<Text style={[styles.description, { color: theme.textSecondary }]}>
							{item.description}
						</Text>
					</View>
					<View
						style={{
							width: "100%",
							height: StyleSheet.hairlineWidth,
							backgroundColor: "lightgrey",
							marginVertical: 12,
						}}
					/>
					{DETAIL_ROWS.map((rowId) => (
						<View
							key={rowId}
							style={{ flexDirection: "row", gap: 12, alignItems: "center" }}
						>
							<View
								style={{
									width: 50,
									height: 50,
									backgroundColor: "lightgrey",
									borderRadius: 20,
									borderCurve: "continuous",
								}}
							/>
							<View style={{ flex: 1, flexDirection: "column", gap: 4 }}>
								<Text
									style={[
										styles.title,
										{ color: theme.text, fontSize: 16, textAlign: "left" },
									]}
								>
									Title
								</Text>
								<Text
									style={[
										styles.description,
										{ color: theme.textSecondary, textAlign: "left" },
									]}
								>
									A short description goes here.
								</Text>
							</View>
						</View>
					))}

					<View
						style={{
							width: "100%",
							height: StyleSheet.hairlineWidth,
							backgroundColor: "lightgrey",
							marginVertical: 12,
							gap: 6,
						}}
					/>
					<View
						style={{
							width: "100%",
						}}
					>
						<Text
							style={[styles.title, { color: theme.text, textAlign: "left" }]}
						>
							What you&apos;ll do
						</Text>
						<Text
							style={[
								styles.description,
								{ color: theme.textSecondary, textAlign: "left" },
							]}
						>
							This example uses containerReveal to keep the destination screen
							visible while the source boundary expands into place. This example
							uses containerReveal to keep the destination screen visible while
							the source boundary expands into place.
						</Text>
					</View>
					<View style={styles.relatedSection}>
						<Text
							style={[
								styles.title,
								{
									color: theme.text,
									fontSize: 20,
									textAlign: "left",
								},
							]}
						>
							Show More
						</Text>
						<View style={styles.relatedGrid}>
							{relatedItems.map((relatedItem) => {
								const relatedTag = toStyleImageTag(relatedItem.id);
								return (
									<Transition.Boundary.Trigger
										key={relatedTag}
										id={relatedTag}
										group={group}
										style={[
											styles.relatedCard,
											{ backgroundColor: theme.card },
										]}
										onPress={() => {
											router.push({
												pathname: buildStackPath(
													stackType,
													"bounds/style-id/[id]",
												) as never,
												params: {
													id: relatedTag,
													mode,
												},
											});
										}}
									>
										<Image
											source={relatedItem.source}
											style={styles.relatedImage}
											contentFit="cover"
										/>
										<View style={styles.relatedText}>
											<Text
												style={[styles.relatedTitle, { color: theme.text }]}
											>
												{relatedItem.title}
											</Text>
											<Text
												style={[
													styles.relatedSubtitle,
													{ color: theme.textSecondary },
												]}
											>
												{relatedItem.subtitle}
											</Text>
										</View>
									</Transition.Boundary.Trigger>
								);
							})}
						</View>
					</View>
					<Button title="Go back" onPress={router.back} />
				</Animated.View>
			</Transition.ScrollView>
		</View>
	);
}

export default function StyleIdBoundsDetail() {
	const { id, mode: modeParam } = useLocalSearchParams<{
		id: string;
		mode?: string;
	}>();
	const navigation = useNavigation() as {
		setParams: (params: { id: string; mode: StyleIdMode }) => void;
	};
	const { width } = useWindowDimensions();
	const flatListRef = useRef<RNFlatList<StyleImageItem> | null>(null);
	const mode = getRouteMode(modeParam);
	const boundaryGroup = mode === "group" ? STYLE_ID_GROUP : undefined;
	const animation = useScreenAnimation();

	useAnimatedReaction(
		() => {
			const value = animation.get();
			if (mode !== "group" || !id || !value.focused || value.next) {
				return null;
			}

			if (!value.current.logicallySettled && !value.current.settled) {
				return null;
			}

			return id;
		},
		(nextId, previousId) => {
			if (!nextId || nextId === previousId) return;
			BoundStore.group.setActiveId(STYLE_ID_GROUP, nextId);
		},
		[id, mode],
	);

	const initialIndex = getStyleImageIndexByTag(id);
	const selectedItem = STYLE_ID_IMAGES[initialIndex];

	useEffect(() => {
		if (mode !== "group") return;

		flatListRef.current?.scrollToIndex({
			index: initialIndex,
			animated: false,
		});
	}, [initialIndex, mode]);

	const handleMomentumScrollEnd = (
		event: NativeSyntheticEvent<NativeScrollEvent>,
	) => {
		const offsetX = event.nativeEvent.contentOffset.x;
		const pageIndex = Math.round(offsetX / width);
		const item = STYLE_ID_IMAGES[pageIndex];
		if (!item) return;

		const tag = toStyleImageTag(item.id);
		if (id !== tag) {
			setBoundsGroupActiveId(boundaryGroup, tag);
			navigation.setParams({
				id: tag,
				mode,
			});
		}
	};

	const getItemLayout = (_: unknown, index: number) => ({
		length: width,
		offset: width * index,
		index,
	});

	const renderItem = ({ item }: ListRenderItemInfo<StyleImageItem>) => (
		<DetailPage item={item} width={width} group={boundaryGroup} mode={mode} />
	);

	const keyExtractor = (item: StyleImageItem) => item.id;

	if (mode === "single") {
		return (
			<DetailPage
				item={selectedItem}
				width={width}
				group={boundaryGroup}
				mode={mode}
			/>
		);
	}

	return (
		<View style={styles.root}>
			<Animated.FlatList
				ref={flatListRef}
				data={STYLE_ID_IMAGES}
				renderItem={renderItem}
				keyExtractor={keyExtractor}
				getItemLayout={getItemLayout}
				initialScrollIndex={initialIndex}
				bounces={false}
				onScrollToIndexFailed={({ index }) => {
					flatListRef.current?.scrollToOffset({
						offset: width * index,
						animated: false,
					});
				}}
				horizontal
				pagingEnabled
				showsHorizontalScrollIndicator={false}
				onMomentumScrollEnd={handleMomentumScrollEnd}
				windowSize={1}
				maxToRenderPerBatch={1}
				initialNumToRender={1}
				scrollEventThrottle={16}
				decelerationRate="fast"
				overScrollMode="never"
				style={styles.flatList}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
	},
	flatList: {
		flex: 1,
	},
	page: {
		flex: 1,
	},
	scroll: {
		flex: 1,
	},
	scrollContent: {
		alignItems: "center",
		gap: 16,
		paddingHorizontal: 24,
		paddingBottom: 100,
	},
	dragHandleContainer: {
		width: "100%",
		alignItems: "center",
		paddingVertical: 12,
	},
	dragHandle: {
		width: 30,
		height: 5,
		borderRadius: 100,
	},
	sharedImage: {
		borderRadius: 32,
		borderCurve: "continuous",
		overflow: "hidden",
	},
	imageContent: {
		width: "100%",
		height: "100%",
	},
	section: {
		width: "100%",
		gap: 12,
		// padding: 12,
	},
	title: {
		fontSize: 24,
		fontWeight: "600",
		textAlign: "center",
	},
	kicker: {
		fontSize: 13,
		fontWeight: "700",
		textAlign: "center",
		textTransform: "uppercase",
		letterSpacing: 0.8,
	},
	subtitle: {
		fontSize: 14,
		fontFamily: "monospace",
	},
	description: {
		fontSize: 14,
		lineHeight: 20,
		textAlign: "center",
		opacity: 0.7,
	},
	card: {
		padding: 16,
		borderRadius: 14,
		gap: 8,
	},
	cardTitle: {
		fontSize: 16,
		fontWeight: "600",
	},
	cardDescription: {
		fontSize: 13,
	},
	relatedSection: {
		width: "100%",
		gap: 12,
	},
	relatedGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 12,
	},
	relatedCard: {
		width: "100%",
		borderRadius: 20,
		borderCurve: "continuous",
		overflow: "hidden",
	},
	relatedImage: {
		width: "100%",
		aspectRatio: 1,
	},
	relatedText: {
		padding: 10,
		gap: 2,
	},
	relatedTitle: {
		fontSize: 13,
		fontWeight: "700",
	},
	relatedSubtitle: {
		fontSize: 11,
		fontWeight: "500",
	},
});
