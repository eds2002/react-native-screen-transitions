import { StyleSheet, Text, View } from "react-native";
import { interpolate } from "react-native-reanimated";
import type { ScreenInterpolationProps } from "react-native-screen-transitions";
import Transition from "react-native-screen-transitions";
import {
	type ComponentStackScreenProps,
	createComponentStackNavigator,
} from "react-native-screen-transitions/component-stack";
import { useTheme } from "@/theme";
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
			opacity: interpolate(progress, [0, 1, 2], [0, 1, 0]),
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
	const theme = useTheme();
	return (
		<BoundsIndicator>
			<View style={styles.containerBottom}>
				<Transition.View
					sharedBoundTag="FLOATING_ELEMENT"
					style={[styles.card, styles.cardCompact, { backgroundColor: theme.surface }]}
				>
					<View style={[styles.handle, { backgroundColor: theme.handle }]} />
					<Text style={[styles.title, { color: theme.text }]}>Nested Home</Text>
					<Text style={[styles.subtitle, { color: theme.textSecondary }]}>Compact nested screen</Text>
					<View style={styles.buttonRow}>
						<Transition.Pressable
							style={[styles.backButton, { backgroundColor: theme.secondaryButton }]}
							onPress={() => navigation.goBack()}
						>
							<Text style={[styles.backButtonText, { color: theme.secondaryButtonText }]}>Back</Text>
						</Transition.Pressable>
						<Transition.Pressable
							style={[styles.expandButton, { backgroundColor: theme.actionButton }]}
							onPress={() => navigation.push("nested-detail")}
						>
							<Text style={[styles.expandButtonText, { color: theme.actionButtonText }]}>Expand</Text>
						</Transition.Pressable>
					</View>
				</Transition.View>
			</View>
		</BoundsIndicator>
	);
}

function NestedDetail({ navigation }: NestedProps) {
	const theme = useTheme();
	return (
		<BoundsIndicator>
			<View style={styles.containerBottom}>
				<Transition.View
					sharedBoundTag="FLOATING_ELEMENT"
					style={[styles.card, styles.cardLarge, { backgroundColor: theme.surface }]}
				>
					<View style={[styles.handle, { backgroundColor: theme.handle }]} />
					<Text style={[styles.title, { color: theme.text }]}>Nested Detail</Text>
					<Text style={[styles.subtitle, { color: theme.textSecondary }]}>
						Swipe down to dismiss (gesture test)
					</Text>

					<Transition.ScrollView
						style={styles.scrollView}
						contentContainerStyle={styles.scrollContent}
					>
						{[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
							<View key={i} style={[styles.scrollCard, { backgroundColor: theme.surfaceElevated }]}>
								<Text style={[styles.scrollCardTitle, { color: theme.text }]}>Nested Item {i}</Text>
								<Text style={[styles.scrollCardText, { color: theme.textSecondary }]}>
									Scrollable content inside nested navigator. Gestures should
									coordinate with scroll position.
								</Text>
							</View>
						))}
					</Transition.ScrollView>

					<View style={[styles.bottomActions, { borderTopColor: theme.separator }]}>
						<Transition.Pressable
							style={[styles.backButton, { backgroundColor: theme.secondaryButton }]}
							onPress={() => navigation.goBack()}
						>
							<Text style={[styles.backButtonText, { color: theme.secondaryButtonText }]}>Back to Home</Text>
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
					// options={nestedScreenOptions}
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
		borderRadius: 24,
		padding: 20,
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
		borderRadius: 2,
		marginBottom: 16,
		alignSelf: "center",
	},
	title: {
		fontSize: 22,
		fontWeight: "700",
		textAlign: "center",
		marginBottom: 4,
	},
	subtitle: {
		fontSize: 14,
		textAlign: "center",
		marginBottom: 20,
	},
	buttonRow: {
		flexDirection: "row",
		justifyContent: "center",
		gap: 12,
	},
	expandButton: {
		paddingHorizontal: 24,
		paddingVertical: 14,
		borderRadius: 999,
	},
	expandButtonText: {
		fontSize: 15,
		fontWeight: "600",
	},
	scrollView: {
		flex: 1,
		marginBottom: 16,
	},
	scrollContent: {
		paddingHorizontal: 4,
	},
	scrollCard: {
		borderRadius: 14,
		padding: 16,
		marginBottom: 12,
	},
	scrollCardTitle: {
		fontSize: 16,
		fontWeight: "600",
		marginBottom: 4,
	},
	scrollCardText: {
		fontSize: 14,
		lineHeight: 20,
	},
	bottomActions: {
		paddingTop: 16,
		borderTopWidth: 1,
	},
	backButton: {
		paddingHorizontal: 24,
		paddingVertical: 14,
		borderRadius: 999,
	},
	backButtonText: {
		fontSize: 15,
		fontWeight: "600",
	},
});
