import { useIsFocused } from "@react-navigation/native";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions } from "react-native";
import {
	scrollTo,
	useAnimatedReaction,
	useAnimatedRef,
	useSharedValue,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import { activeBoundaryId, BOUNDARY_GROUP, ITEMS } from "./constants";

const ITEM_SIZE = 100;
const GAP = 16;

export default function BoundsIndex() {
	const { width: screenWidth } = useWindowDimensions();
	const scrollRef = useAnimatedRef<any>();
	const isFocused = useIsFocused();
	const isFocusedShared = useSharedValue(isFocused ? 1 : 0);
	const pushInFlight = useRef(false);
	const queuedSelection = useRef<string | null>(null);

	useEffect(() => {
		isFocusedShared.value = isFocused ? 1 : 0;
		if (isFocused) {
			pushInFlight.current = false;

			const nextQueuedId = queuedSelection.current;
			if (nextQueuedId) {
				queuedSelection.current = null;
				activeBoundaryId.value = nextQueuedId;
				pushInFlight.current = true;

				requestAnimationFrame(() => {
					router.push(
						`/blank-stack/bounds/${nextQueuedId}` as `/blank-stack/bounds/${string}`,
					);
				});
			}
		}
	}, [isFocused, isFocusedShared]);

	// Horizontal padding so first and last items can center in the viewport.
	const horizontalPadding = screenWidth / 2 - ITEM_SIZE / 2;

	// Auto-scroll to center the active boundary when it changes
	// (e.g., when the user pages through the detail screen).
	useAnimatedReaction(
		() => activeBoundaryId.value,
		(activeId, previousId) => {
			"worklet";
			if (isFocusedShared.value === 1) return;
			if (activeId === previousId) return;

			let index = -1;
			for (let i = 0; i < ITEMS.length; i++) {
				if (ITEMS[i].id === activeId) {
					index = i;
					break;
				}
			}
			if (index === -1) return;

			const offsetX = index * (ITEM_SIZE + GAP);
			scrollTo(scrollRef, offsetX, 0, false);
		},
	);

	return (
		<SafeAreaView style={styles.container} edges={[]}>
			<ScreenHeader
				title="Boundary (v2)"
				subtitle="Dynamic retargeting · horizontal scroll"
			/>
			<Transition.ScrollView
				ref={scrollRef}
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={[
					styles.scrollContent,
					{ paddingHorizontal: horizontalPadding, overflow: "visible" },
				]}
				style={[styles.scrollView, { overflow: "visible" }]}
			>
				{ITEMS.map((item) => (
					<Pressable
						key={item.id}
						testID={`bounds-open-${item.id}`}
						onPress={() => {
							if (!isFocused) {
								queuedSelection.current = item.id;
								return;
							}

							if (pushInFlight.current) {
								queuedSelection.current = item.id;
								return;
							}

							activeBoundaryId.value = item.id;
							pushInFlight.current = true;

							router.push(
								`/blank-stack/bounds/${item.id}` as `/blank-stack/bounds/${string}`,
							);
						}}
						style={{ overflow: "visible" }}
					>
						<Transition.Boundary
							group={BOUNDARY_GROUP}
							id={item.id}
							style={[
								styles.source,
								{ backgroundColor: item.color, overflow: "visible" },
							]}
						>
							<Text style={styles.sourceText}>{item.label}</Text>
						</Transition.Boundary>
					</Pressable>
				))}
			</Transition.ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#121212",
	},
	scrollView: {
		flexGrow: 0,
		marginTop: "auto",
		marginBottom: "auto",
	},
	scrollContent: {
		alignItems: "center",
		gap: GAP,
	},
	source: {
		width: ITEM_SIZE,
		height: ITEM_SIZE,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
	},
	sourceText: {
		color: "#fff",
		fontWeight: "700",
		fontSize: 24,
	},
});
