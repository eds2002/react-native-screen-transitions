import { router } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
	type LayoutChangeEvent,
	Pressable,
	StyleSheet,
	Text,
	useWindowDimensions,
	View,
} from "react-native";
import { runOnJS, useAnimatedReaction } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition, {
	useScreenAnimation,
} from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { useTheme } from "@/theme";
import {
	BOUNDS_SYNC_ZOOM_ITEMS,
	type BoundsSyncZoomItem,
	ZOOM_GROUP,
	type ZoomExampleMode,
} from "./constants";

const GAP = 10;
const PADDING = 16;

type ScrollToTarget = {
	scrollTo: (options: { y: number; animated: boolean }) => void;
};

const getRouteParam = (route: { params?: object } | undefined, key: string) => {
	"worklet";
	const params = route?.params as Record<string, unknown> | undefined;
	const value = params?.[key];
	return typeof value === "string" ? value : "";
};

const getRouteMode = (
	route: { params?: object } | undefined,
): ZoomExampleMode => {
	"worklet";
	return getRouteParam(route, "mode") === "single" ? "single" : "group";
};

function ZoomSourceCard({
	item,
	colWidth,
	mode,
	onLayout,
}: {
	item: BoundsSyncZoomItem;
	colWidth: number;
	mode: ZoomExampleMode;
	onLayout: (event: LayoutChangeEvent) => void;
}) {
	const stackType = useResolvedStackType();
	const cardWidth = item.cols === 2 ? colWidth * 2 + GAP : colWidth;

	return (
		<Transition.Boundary.Trigger
			group={mode === "group" ? ZOOM_GROUP : undefined}
			id={item.id}
			onLayout={onLayout}
			style={[
				styles.card,
				{
					backgroundColor: item.color,
					width: cardWidth,
					height: item.height,
				},
			]}
			onPress={() => {
				router.push({
					pathname: buildStackPath(stackType, "bounds/zoom/[id]") as never,
					params: {
						id: item.id,
						mode,
					},
				});
			}}
		>
			<Text style={styles.title}>{item.title}</Text>
			<Text style={styles.subtitle}>{item.subtitle}</Text>
		</Transition.Boundary.Trigger>
	);
}

export default function NavigationZoomGroupTransitionsIndex() {
	const { width } = useWindowDimensions();
	const colWidth = (width - PADDING * 2 - GAP) / 2;
	const theme = useTheme();
	const scrollRef = useRef(null);
	const itemOffsetsRef = useRef<Record<string, number>>({});
	const [mode, setMode] = useState<ZoomExampleMode>("group");
	const animation = useScreenAnimation();

	const setZoomMode = useCallback((nextMode: ZoomExampleMode) => {
		setMode(nextMode);
	}, []);

	const scrollToActiveItem = useCallback((id: string) => {
		const activeItemOffset = itemOffsetsRef.current[id];
		if (typeof activeItemOffset !== "number") return;

		const scrollView = scrollRef.current as ScrollToTarget | null;
		scrollView?.scrollTo({
			y: Math.max(0, activeItemOffset - 24),
			animated: false,
		});
	}, []);

	useAnimatedReaction(
		() => {
			const value = animation.get();
			const activeRoute = value.active.route;
			if (value.active.entering || getRouteMode(activeRoute) === "single") {
				return null;
			}

			return getRouteParam(activeRoute, "id");
		},
		(id, previousId) => {
			if (!id || id === previousId) return;
			runOnJS(scrollToActiveItem)(id);
		},
		[scrollToActiveItem],
	);

	return (
		<SafeAreaView
			style={[styles.container, { backgroundColor: theme.bg }]}
			edges={["top"]}
		>
			<ScreenHeader
				title="Navigation Zoom Transitions"
				subtitle={
					mode === "group"
						? "bounds({ id, group }).navigation.zoom()"
						: "bounds({ id }).navigation.zoom()"
				}
			/>

			<View style={styles.segmentedControl}>
				{(["group", "single"] as const).map((item) => {
					const selected = mode === item;
					return (
						<Pressable
							key={item}
							onPress={() => setZoomMode(item)}
							style={[
								styles.segment,
								{
									backgroundColor: selected
										? theme.actionButton
										: theme.surface,
								},
							]}
						>
							<Text
								style={[
									styles.segmentLabel,
									{
										color: selected
											? theme.actionButtonText
											: theme.textSecondary,
									},
								]}
							>
								{item === "group" ? "Group" : "Single"}
							</Text>
						</Pressable>
					);
				})}
			</View>

			<Transition.ScrollView
				ref={scrollRef}
				contentContainerStyle={styles.scrollContent}
			>
				<View style={styles.grid}>
					{BOUNDS_SYNC_ZOOM_ITEMS.map((item) => (
						<ZoomSourceCard
							key={item.id}
							item={item}
							colWidth={colWidth}
							mode={mode}
							onLayout={(event) => {
								itemOffsetsRef.current[item.id] = event.nativeEvent.layout.y;
							}}
						/>
					))}
				</View>
			</Transition.ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	segmentedControl: {
		flexDirection: "row",
		gap: 8,
		paddingHorizontal: PADDING,
		paddingBottom: 12,
	},
	segment: {
		flex: 1,
		height: 36,
		borderRadius: 8,
		alignItems: "center",
		justifyContent: "center",
	},
	segmentLabel: {
		fontSize: 13,
		fontWeight: "700",
	},
	scrollContent: {
		paddingHorizontal: PADDING,
		paddingBottom: 40,
		overflow: "visible",
	},
	grid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: GAP,
		overflow: "visible",
	},
	card: {
		borderRadius: 20,
		padding: 14,
		justifyContent: "flex-end",
		overflow: "hidden",
	},
	title: {
		color: "#fff",
		fontSize: 18,
		fontWeight: "700",
	},
	subtitle: {
		marginTop: 2,
		color: "rgba(255,255,255,0.75)",
		fontSize: 11,
		fontWeight: "500",
	},
});
