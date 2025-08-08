import { StyleSheet, Text, View } from "react-native";
import {
	Gesture,
	GestureDetector,
	GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
	useAnimatedRef,
	useAnimatedStyle,
	useScrollViewOffset,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";

const MIN_MOVE = 5;
const RESPONSE_DIST = 50;
const GESTURE_VELOCITY_IMPACT = 0.3;

export default function DeeplyNestedScrolls() {
	const parentY = useSharedValue(0);

	const childY = useSharedValue(0);
	const isDragging = useSharedValue(0);
	const isDismissing = useSharedValue(0);
	const scrollEnabled = useSharedValue(true);

	const scrollRef = useAnimatedRef<Animated.ScrollView>();
	const scrollOffsetY = useScrollViewOffset(scrollRef);

	const initialTouch = useSharedValue({ y: 0 });

	const parentPan = Gesture.Pan()
		.onUpdate((e) => {
			"worklet";
			parentY.value = e.translationY;
		})
		.onEnd(() => {
			"worklet";
			parentY.value = withTiming(0, { duration: 200 });
		});

	const nativeGesture = Gesture.Native();

	const childPan = Gesture.Pan()
		.manualActivation(true)
		.enableTrackpadTwoFingerGesture(true)
		.onTouchesDown((e) => {
			"worklet";
			const t = e.changedTouches[0];
			initialTouch.value = { y: t.y };
		})
		.onTouchesMove((e, manager) => {
			"worklet";
			// If already dragging, keep the gesture active
			if (isDragging.value === 1) {
				return;
			}

			const t = e.changedTouches[0];
			const dy = t.y - initialTouch.value.y;

			const isDownward = dy > 0;
			const movedEnough = Math.abs(dy) > MIN_MOVE;

			const atTop = (scrollOffsetY.value ?? 0) <= 0;

			// Activate when dragging down from the top
			if (movedEnough && isDownward && atTop) {
				manager.activate();
			} else if (movedEnough) {
				// Fail if we've moved enough but conditions aren't met
				manager.fail();
			}
		})
		.onStart(() => {
			"worklet";
			isDragging.value = 1;
			isDismissing.value = 0;
		})
		.onUpdate((e) => {
			"worklet";
			childY.value = e.translationY;
		})
		.onEnd((e) => {
			"worklet";
			const shouldDismiss =
				e.translationY > RESPONSE_DIST ||
				(e.translationY > 0 && e.velocityY > 500);

			isDismissing.value = Number(shouldDismiss);

			childY.value = withTiming(0, { duration: 200 });
			isDragging.value = 0;
		})
		.onFinalize(() => {
			"worklet";
			isDragging.value = 0; // Reset dragging state on finalize
		})
		.blocksExternalGesture(nativeGesture);

	const parentStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: parentY.value }],
	}));

	const childStyle = useAnimatedStyle(() => ({
		transform: [{ translateY: childY.value }],
	}));

	const scrollEnabledStyle = useAnimatedStyle(() => ({
		pointerEvents: scrollEnabled.value ? "auto" : "none",
	}));

	return (
		// <GestureDetector gesture={parentPan}>
		// 	<Animated.View style={[styles.parent, parentStyle]}>
		<GestureDetector gesture={childPan}>
			<Animated.View style={[styles.child, childStyle]}>
				<GestureDetector gesture={nativeGesture}>
					<Animated.View style={[styles.scroll, scrollEnabledStyle]}>
						<Animated.ScrollView
							ref={scrollRef}
							style={styles.scroll}
							contentContainerStyle={styles.scrollContent}
							showsVerticalScrollIndicator
							scrollEnabled={true}
						>
							{Array.from({ length: 20 }).map((_, i) => (
								<View key={i.toString()} style={styles.item}>
									<Text style={{ color: "white" }}>Item {i + 1}</Text>
								</View>
							))}
						</Animated.ScrollView>
					</Animated.View>
				</GestureDetector>
			</Animated.View>
		</GestureDetector>
		// 	</Animated.View>
		// </GestureDetector>
	);
}

const styles = StyleSheet.create({
	root: { flex: 1 },
	parent: {
		flex: 0.85,
		backgroundColor: "yellow",
		alignItems: "center",
		marginTop: "auto",
		padding: 24,
	},
	child: {
		width: "100%",
		height: "90%",
		marginTop: "auto",
		backgroundColor: "orange",
		borderRadius: 12,
		overflow: "hidden",
		padding: 48,
	},
	scroll: {
		flex: 1,
		backgroundColor: "red",
	},
	scrollContent: {
		padding: 16,
		rowGap: 12,
	},
	item: {
		height: 60,
		backgroundColor: "rgba(255,255,255,0.2)",
		borderRadius: 8,
		alignItems: "center",
		justifyContent: "center",
	},
});
