import { useLocalSearchParams } from "expo-router";
import { useRef } from "react";
import type {
	NativeScrollEvent,
	NativeSyntheticEvent,
	ScrollView,
} from "react-native";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import { activeBoundaryId, BOUNDARY_GROUP, ITEMS } from "./constants";

export default function BoundsDetail() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const { width } = useWindowDimensions();
	const scrollRef = useRef<ScrollView>(null);

	const initialIndex = Math.max(
		0,
		ITEMS.findIndex((item) => item.id === id),
	);
	const itemSize = width * 0.92;

	const handleMomentumScrollEnd = (
		event: NativeSyntheticEvent<NativeScrollEvent>,
	) => {
		const offsetX = event.nativeEvent.contentOffset.x;
		const pageIndex = Math.round(offsetX / width);
		const item = ITEMS[pageIndex];

		if (!item) return;

		activeBoundaryId.value = item.id;
	};

	return (
		<SafeAreaView style={styles.container} edges={[]}>
			<ScreenHeader title="Boundary Detail" subtitle={`Active: ${id}`} />
			<View style={styles.content}>
				<Animated.ScrollView
					ref={scrollRef as any}
					horizontal
					pagingEnabled
					showsHorizontalScrollIndicator={false}
					contentOffset={{ x: initialIndex * width, y: 0 }}
					onMomentumScrollEnd={handleMomentumScrollEnd}
					style={styles.scrollView}
				>
					{ITEMS.map((item) => (
						<View key={item.id} style={[styles.page, { width }]}>
							<Transition.Boundary
								group={BOUNDARY_GROUP}
								id={item.id}
								style={[
									styles.destination,
									{
										width: itemSize,
										height: itemSize,
										backgroundColor: item.color,
									},
								]}
							>
								<Text style={styles.destinationText}>{item.label}</Text>
							</Transition.Boundary>
						</View>
					))}
				</Animated.ScrollView>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
	},
	scrollView: {
		flex: 1,
	},
	page: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	destination: {
		borderRadius: 24,
		alignItems: "center",
		justifyContent: "center",
	},
	destinationText: {
		color: "#fff",
		fontWeight: "700",
		fontSize: 48,
	},
});
