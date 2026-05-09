import { Image } from "expo-image";
import { router } from "expo-router";
import { useCallback, useRef, useState } from "react";
import {
	type LayoutChangeEvent,
	Pressable,
	StyleSheet,
	Text,
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
	STYLE_ID_GROUP,
	STYLE_ID_IMAGES,
	type StyleIdMode,
	type StyleImageItem,
	toStyleImageTag,
} from "./constants";

type ScrollToTarget = {
	scrollTo: (options: { y: number; animated: boolean }) => void;
};

const getRouteParam = (route: { params?: object } | undefined, key: string) => {
	"worklet";
	const params = route?.params as Record<string, unknown> | undefined;
	const value = params?.[key];
	return typeof value === "string" ? value : "";
};

const getRouteMode = (route: { params?: object } | undefined): StyleIdMode => {
	"worklet";
	return getRouteParam(route, "mode") === "single" ? "single" : "group";
};

function StyleIdSourceCard({
	item,
	mode,
	onLayout,
}: {
	item: StyleImageItem;
	mode: StyleIdMode;
	onLayout: (event: LayoutChangeEvent) => void;
}) {
	const stackType = useResolvedStackType();
	const theme = useTheme();
	const tag = toStyleImageTag(item.id);

	return (
		<Transition.Boundary.Trigger
			key={tag}
			testID={tag}
			id={tag}
			group={mode === "group" ? STYLE_ID_GROUP : undefined}
			onLayout={onLayout}
			style={[styles.imageCell, { backgroundColor: theme.card }]}
			onPress={() => {
				router.push({
					pathname: buildStackPath(stackType, "bounds/style-id/[id]") as never,
					params: {
						id: tag,
						mode,
					},
				});
			}}
		>
			<Image source={item.source} style={styles.image} contentFit="cover" />
		</Transition.Boundary.Trigger>
	);
}

export default function StyleIdBoundsIndex() {
	const theme = useTheme();
	const scrollRef = useRef(null);
	const itemOffsetsRef = useRef<Record<string, number>>({});
	const [mode, setMode] = useState<StyleIdMode>("group");
	const animation = useScreenAnimation();

	const setStyleMode = useCallback((nextMode: StyleIdMode) => {
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
				title="Custom Bounds Mask"
				subtitle={
					mode === "group"
						? "bounds({ id, group }).navigation.containerReveal()"
						: "bounds({ id }).navigation.containerReveal()"
				}
			/>

			<View style={styles.segmentedControl}>
				{(["group", "single"] as const).map((item) => {
					const selected = mode === item;
					return (
						<Pressable
							key={item}
							onPress={() => setStyleMode(item)}
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
				contentContainerStyle={styles.content}
			>
				<View style={styles.grid}>
					{STYLE_ID_IMAGES.map((item) => {
						const tag = toStyleImageTag(item.id);
						return (
							<StyleIdSourceCard
								key={tag}
								item={item}
								mode={mode}
								onLayout={(event) => {
									itemOffsetsRef.current[tag] = event.nativeEvent.layout.y;
								}}
							/>
						);
					})}
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
		paddingHorizontal: 16,
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
	content: {
		padding: 16,
		paddingBottom: 40,
	},
	grid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 12,
		marginTop: 16,
	},
	imageCell: {
		width: "48%",
		aspectRatio: 1,
		borderRadius: 24,
		borderCurve: "continuous",
		overflow: "hidden",
	},
	image: {
		width: "100%",
		height: "100%",
	},
});
