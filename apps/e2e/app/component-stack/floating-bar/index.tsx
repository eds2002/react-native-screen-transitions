import { Pressable, StyleSheet, Text, View } from "react-native";
import { interpolate } from "react-native-reanimated";
import type { ScreenStyleInterpolator } from "react-native-screen-transitions";
import Transition from "react-native-screen-transitions";
import { createBlankStackNavigator } from "react-native-screen-transitions/blank-stack";
import type { ComponentStackScreenProps } from "react-native-screen-transitions/component-stack";

const Stack = createBlankStackNavigator({ DISABLE_NATIVE_SCREENS: true });

const SHARED_BOUND_TAG = "floating-trigger";

/**
 * Simulated Mask Container
 * Uses red border to visualize the mask boundary.
 * In production, this would be a MaskedView.
 */
function SimulatedMaskOverlay({ children }: { children: React.ReactNode }) {
	return (
		<View style={{ flex: 1 }}>
			{children}
			<Transition.View
				styleId="SIM_MASK"
				style={[styles.maskContainer, StyleSheet.absoluteFillObject]}
			/>
			{/*^ orchestrate animation for this */}
		</View>
	);
}

/**
 * Idle Screen - Shows the floating trigger button
 */
function IdleScreen({ navigation }: ComponentStackScreenProps) {
	return (
		<Transition.View style={[styles.idleContainer]} styleId="IDLE">
			<Transition.View
				sharedBoundTag={SHARED_BOUND_TAG}
				style={styles.floatingButton}
				onTouchStart={() => navigation.push("Expanded")}
			>
				<View style={styles.floatingButtonInner}>
					<Text style={styles.floatingButtonText}>Expand me</Text>
				</View>
			</Transition.View>
		</Transition.View>
	);
}

/**
 * Expanded Screen - Shows the expanded card content
 */
function ExpandedScreen({ navigation }: ComponentStackScreenProps) {
	return (
		<Transition.View style={{ flex: 1, paddingTop: 100 }}>
			<Transition.View
				style={[styles.expandedContainer]}
				sharedBoundTag={SHARED_BOUND_TAG}
			>
				<Transition.View styleId="CONTAINER" style={{ flex: 1 }}>
					<Transition.ScrollView
						style={[styles.card, { paddingTop: 100, flex: 1, padding: 24 }]}
					>
						<Text style={styles.cardTitle}>Expanded Details</Text>
						<Text style={styles.cardDescription}>
							This content is dynamically sized based on its children. No
							hardcoded heights here! The mask should animate from the small
							floating button to encompass this entire card.
						</Text>
						<Text style={styles.cardDescription}>
							You can add as much content as you want and the layout will adjust
							automatically. This demonstrates that the animation system works
							with intrinsic sizing.
						</Text>
						<View style={styles.cardActions}>
							<Pressable
								style={styles.actionButton}
								onPress={() => navigation.goBack()}
							>
								<Text style={styles.actionButtonText}>Close</Text>
							</Pressable>
							<Pressable style={[styles.actionButton, styles.primaryButton]}>
								<Text style={styles.actionButtonText}>Action</Text>
							</Pressable>
						</View>
					</Transition.ScrollView>
				</Transition.View>
			</Transition.View>
		</Transition.View>
	);
}

/**
 * Screen style interpolator that animates the mask
 * from the floating button size to full container
 */
const floatingBarInterpolator: ScreenStyleInterpolator = ({
	bounds,
	progress,
	layouts: { screen },
	focused,
	current,
	previous,
	next,
}) => {
	"worklet";

	const currentOcc = bounds.getSnapshot(SHARED_BOUND_TAG, current.route.key);
	const targetKey = focused
		? (previous?.route.key ?? "")
		: (next?.route.key ?? "");
	const targetOcc = bounds.getSnapshot(SHARED_BOUND_TAG, targetKey);

	const fallbackBounds = {
		width: screen.width,
		height: screen.height,
		pageX: 0,
		pageY: 0,
	};

	const currentBounds = currentOcc?.bounds ?? fallbackBounds;
	const targetBounds = targetOcc?.bounds ?? currentBounds;

	const currentRadius =
		typeof currentOcc?.styles?.borderRadius === "number"
			? currentOcc.styles.borderRadius
			: 12;
	const targetRadius =
		typeof targetOcc?.styles?.borderRadius === "number"
			? targetOcc.styles.borderRadius
			: currentRadius;

	const range: [number, number] = focused ? [0, 1] : [1, 2];
	const startBounds = focused ? targetBounds : currentBounds;
	const endBounds = focused ? currentBounds : targetBounds;
	const startRadius = focused ? targetRadius : currentRadius;
	const endRadius = focused ? currentRadius : targetRadius;

	return {
		SIM_MASK: {
			width: interpolate(progress, range, [startBounds.width, endBounds.width]),
			height: interpolate(progress, range, [
				startBounds.height,
				endBounds.height,
			]),
			transform: [
				{
					translateX: interpolate(progress, range, [
						startBounds.pageX,
						endBounds.pageX,
					]),
				},
				{
					translateY: interpolate(progress, range, [
						startBounds.pageY,
						endBounds.pageY,
					]),
				},
			],
			borderRadius: interpolate(progress, range, [startRadius, endRadius]),
		},
		IDLE: {
			transform: [
				{
					translateY: interpolate(
						progress,
						[0, 1, 2],
						[0, 0, -(endBounds.pageY + endBounds.height - 100)],
					),
				},
			],
		},
		CONTAINER: {
			transform: [
				{
					translateY: interpolate(
						progress,
						[0, 1],
						[startBounds.pageY + startBounds.height - 100, 0],
					),
				},
			],
		},
	};
};

function FloatingBarDemo() {
	return (
		<Stack.Navigator
			initialRouteName="Idle"
			screenOptions={{
				overlay: SimulatedMaskOverlay,
				overlayMode: "screen",
				overlayShown: true,
			}}
		>
			<Stack.Screen name="Idle" component={IdleScreen} />
			<Stack.Screen
				name="Expanded"
				component={ExpandedScreen}
				options={{
					gestureEnabled: true,
					gestureDirection: "vertical",
					screenStyleInterpolator: floatingBarInterpolator,
					transitionSpec: {
						open: {
							damping: 500,
							stiffness: 500,
							mass: 3,
						},
						close: {
							damping: 500,
							stiffness: 500,
							mass: 3,
						},
					},
				}}
			/>
		</Stack.Navigator>
	);
}

export default function FloatingBarExample() {
	return (
		<>
			<View style={styles.demoContainer}>
				<FloatingBarDemo />
			</View>

			<Text style={styles.hint}>Red border = mask boundary (visible area)</Text>
		</>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#121212",
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		padding: 16,
		borderBottomWidth: 1,
		borderBottomColor: "#333",
	},
	headerBack: {
		padding: 8,
	},
	headerBackText: {
		color: "#4a9eff",
		fontSize: 16,
	},
	headerTitle: {
		color: "#fff",
		fontSize: 18,
		fontWeight: "600",
		marginLeft: 16,
	},
	demoContainer: {
		flex: 1,
		// margin: 16,
		backgroundColor: "#0a0a0a",
		borderRadius: 16,
	},
	hint: {
		color: "#666",
		fontSize: 12,
		textAlign: "center",
		paddingBottom: 16,
	},

	// Mask container styles
	maskContainer: {
		overflow: "hidden",
		borderWidth: 3,
		borderColor: "red",
		pointerEvents: "box-none",
	},
	maskContent: {
		flex: 1,
	},

	// Idle screen styles
	idleContainer: {
		justifyContent: "center",
		alignItems: "center",
		marginTop: "auto",
		backgroundColor: "green",
	},
	floatingButton: {
		backgroundColor: "#4a9eff",
		borderRadius: 12,
	},
	floatingButtonInner: {
		paddingHorizontal: 32,
		paddingVertical: 50,
	},
	floatingButtonText: {
		color: "#fff",
		fontSize: 18,
		fontWeight: "600",
	},

	// Expanded screen styles
	expandedContainer: {
		flex: 1,
		// padding: 24,
		justifyContent: "center",
	},
	card: {
		backgroundColor: "#2a2a2a",
		borderRadius: 16,
		// padding: 24,
	},
	cardTitle: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#fff",
		marginBottom: 16,
	},
	cardDescription: {
		fontSize: 16,
		color: "#aaa",
		lineHeight: 24,
		marginBottom: 16,
	},
	cardActions: {
		flexDirection: "row",
		gap: 12,
		marginTop: 8,
	},
	actionButton: {
		flex: 1,
		backgroundColor: "#333",
		paddingVertical: 14,

		borderRadius: 10,
		alignItems: "center",
	},
	primaryButton: {
		backgroundColor: "#4a9eff",
	},
	actionButtonText: {
		color: "#fff",
		fontSize: 16,
		fontWeight: "600",
	},
});
