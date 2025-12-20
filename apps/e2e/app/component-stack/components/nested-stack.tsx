import { StyleSheet, Text, View } from "react-native";
import { interpolate } from "react-native-reanimated";
import type { ScreenInterpolationProps } from "react-native-screen-transitions";
import Transition from "react-native-screen-transitions";
import {
	type ComponentStackScreenProps,
	createComponentStackNavigator,
} from "react-native-screen-transitions/component-stack";
import { BoundsIndicator } from "./bounds-indicator";
import { transitionSpec } from "./interpolator";

type NestedParamList = {
	"nested-home": undefined;
	"nested-detail": undefined;
};

type NestedProps = ComponentStackScreenProps<NestedParamList>;

const NestedStack = createComponentStackNavigator<NestedParamList>();

const nestedInterpolator = (props: ScreenInterpolationProps) => {
	"worklet";

	const { bounds, progress } = props;
	const entering = !props.next;

	// Get interpolated position
	const interpolatedPageX = bounds.interpolateBounds(
		"FLOATING_ELEMENT",
		"pageX",
		0,
	);
	const interpolatedPageY = bounds.interpolateBounds(
		"FLOATING_ELEMENT",
		"pageY",
		0,
	);
	const interpolatedWidth = bounds.interpolateBounds(
		"FLOATING_ELEMENT",
		"width",
		0,
	);
	const interpolatedHeight = bounds.interpolateBounds(
		"FLOATING_ELEMENT",
		"height",
		0,
	);

	// Get current screen's natural position
	const link = bounds.getLink("FLOATING_ELEMENT");
	const currentBounds = entering
		? link?.destination?.bounds
		: link?.source?.bounds;
	const currentPageX = currentBounds?.pageX ?? 0;
	const currentPageY = currentBounds?.pageY ?? 0;

	// Calculate offset from natural position
	const translateX = interpolatedPageX - currentPageX;
	const translateY = interpolatedPageY - currentPageY;

	return {
		BOUNDS_INDICATOR: {
			height: interpolatedHeight,
			width: interpolatedWidth,
			transform: [
				{ translateX: interpolatedPageX },
				{ translateY: interpolatedPageY },
			],
			opacity: interpolate(progress, [0, 1, 2], [0, 1, 0]),
		},
		FLOATING_ELEMENT: {
			transform: [{ translateX }, { translateY }],
		},
	};
};

const nestedScreenOptions = {
	screenStyleInterpolator: nestedInterpolator,
	transitionSpec,
	gestureEnabled: true,
	gestureDirection: "vertical" as const,
};

function NestedHome({ navigation }: NestedProps) {
	return (
		<BoundsIndicator>
			<View style={styles.containerBottom}>
				<Transition.View
					sharedBoundTag="FLOATING_ELEMENT"
					style={[styles.card, styles.cardCompact]}
				>
					<View style={styles.handle} />
					<Text style={styles.title}>Nested Home</Text>
					<Text style={styles.subtitle}>Compact nested screen</Text>
					<View style={styles.buttonRow}>
						<Transition.Pressable
							style={styles.backButton}
							onPress={() => navigation.goBack()}
						>
							<Text style={styles.backButtonText}>Back</Text>
						</Transition.Pressable>
						<Transition.Pressable
							style={styles.expandButton}
							onPress={() => navigation.push("nested-detail")}
						>
							<Text style={styles.expandButtonText}>Expand</Text>
						</Transition.Pressable>
					</View>
				</Transition.View>
			</View>
		</BoundsIndicator>
	);
}

function NestedDetail({ navigation }: NestedProps) {
	return (
		<BoundsIndicator>
			<View style={styles.containerBottom}>
				<Transition.View
					sharedBoundTag="FLOATING_ELEMENT"
					style={[styles.card, styles.cardLarge]}
				>
					<View style={styles.handle} />
					<Text style={styles.title}>Nested Detail</Text>
					<Text style={styles.subtitle}>
						Swipe down to dismiss (gesture test)
					</Text>

					<Transition.ScrollView
						style={styles.scrollView}
						contentContainerStyle={styles.scrollContent}
					>
						{[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
							<View key={i} style={styles.scrollCard}>
								<Text style={styles.scrollCardTitle}>Nested Item {i}</Text>
								<Text style={styles.scrollCardText}>
									Scrollable content inside nested navigator. Gestures should
									coordinate with scroll position.
								</Text>
							</View>
						))}
					</Transition.ScrollView>

					<View style={styles.bottomActions}>
						<Transition.Pressable
							style={styles.backButton}
							onPress={() => navigation.goBack()}
						>
							<Text style={styles.backButtonText}>Back to Home</Text>
						</Transition.Pressable>
					</View>
				</Transition.View>
			</View>
		</BoundsIndicator>
	);
}

export function NestedStackScreen() {
	return (
		<View style={styles.nestedContainer} pointerEvents="box-none">
			<NestedStack.Navigator initialRouteName="nested-home">
				<NestedStack.Screen
					name="nested-home"
					component={NestedHome}
					options={nestedScreenOptions}
				/>
				<NestedStack.Screen
					name="nested-detail"
					component={NestedDetail}
					options={nestedScreenOptions}
				/>
			</NestedStack.Navigator>
		</View>
	);
}

const styles = StyleSheet.create({
	nestedContainer: {
		...StyleSheet.absoluteFillObject,
	},
	containerBottom: {
		flex: 1,
		justifyContent: "flex-end",
		padding: 16,
		paddingBottom: 32,
	},
	card: {
		backgroundColor: "#1a1a1a",
		borderRadius: 24,
		padding: 20,
		borderWidth: 1,
		borderColor: "#444",
	},
	cardCompact: {
		// Similar to compact size
	},
	cardLarge: {
		minHeight: 400,
	},
	handle: {
		width: 40,
		height: 4,
		backgroundColor: "#555",
		borderRadius: 2,
		marginBottom: 16,
		alignSelf: "center",
	},
	title: {
		fontSize: 22,
		fontWeight: "700",
		color: "#fff",
		textAlign: "center",
		marginBottom: 4,
	},
	subtitle: {
		fontSize: 14,
		color: "#888",
		textAlign: "center",
		marginBottom: 20,
	},
	buttonRow: {
		flexDirection: "row",
		justifyContent: "center",
		gap: 12,
	},
	expandButton: {
		backgroundColor: "#4a90d9",
		paddingHorizontal: 24,
		paddingVertical: 14,
		borderRadius: 20,
	},
	expandButtonText: {
		fontSize: 15,
		fontWeight: "600",
		color: "#fff",
	},
	scrollView: {
		flex: 1,
		marginBottom: 16,
	},
	scrollContent: {
		paddingHorizontal: 4,
	},
	scrollCard: {
		backgroundColor: "#252525",
		borderRadius: 16,
		padding: 16,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: "#333",
	},
	scrollCardTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: "#fff",
		marginBottom: 4,
	},
	scrollCardText: {
		fontSize: 14,
		color: "#888",
		lineHeight: 20,
	},
	bottomActions: {
		paddingTop: 16,
		borderTopWidth: 1,
		borderTopColor: "#333",
	},
	backButton: {
		backgroundColor: "#333",
		paddingHorizontal: 24,
		paddingVertical: 14,
		borderRadius: 20,
	},
	backButtonText: {
		fontSize: 15,
		fontWeight: "600",
		color: "#fff",
	},
});
