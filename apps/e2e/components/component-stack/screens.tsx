import { StyleSheet, Text, View } from "react-native";
import Transition from "react-native-screen-transitions";
import type { ComponentStackScreenProps } from "react-native-screen-transitions/component-stack";
import { useTheme } from "@/theme";
import { BoundsIndicator } from "./bounds-indicator";
import { NestedStackScreen } from "./nested-stack";

export type ScreenParamList = {
	compact: undefined;
	medium: undefined;
	large: undefined;
	fullscreen: undefined;
	nested: undefined;
};

type Props = ComponentStackScreenProps<ScreenParamList>;

const NAV_BUTTONS: {
	name: keyof ScreenParamList;
	label: string;
	type?: string;
}[] = [
	{ name: "compact", label: "Compact" },
	{ name: "medium", label: "Medium" },
	{ name: "large", label: "Large" },
	{ name: "fullscreen", label: "Full" },
	{ name: "nested", label: "Nested", type: "PUSH" },
];

function NavButtons({
	navigation,
	current,
}: {
	navigation: Props["navigation"];
	current: keyof ScreenParamList;
}) {
	const theme = useTheme();
	return (
		<View style={styles.navRow}>
			{NAV_BUTTONS.map(({ name, label, type }) => (
				<Transition.Pressable
					key={name}
					style={[
						styles.navButton,
						{ backgroundColor: current === name ? theme.activePill : theme.pill },
					]}
					onPress={() => {
						if (current !== name) {
							if (type === "PUSH") {
								navigation.push(name);
							} else {
								navigation.replace(name);
							}
						}
					}}
				>
					<Text
						style={[
							styles.navButtonText,
							{ color: current === name ? theme.activePillText : theme.pillText },
						]}
					>
						{label}
					</Text>
				</Transition.Pressable>
			))}
		</View>
	);
}

/**
 * ScreenA - Compact (small floating bar)
 */
export function ScreenCompact({ navigation }: Props) {
	const theme = useTheme();
	return (
		<BoundsIndicator>
			<View style={styles.containerBottom}>
				<Transition.View
					sharedBoundTag="FLOATING_ELEMENT"
					style={[styles.card, styles.cardCompact, { backgroundColor: theme.surface }]}
				>
					<View style={[styles.handle, { backgroundColor: theme.handle }]} />
					<Text style={[styles.title, { color: theme.text }]}>Compact</Text>
					<Text style={[styles.subtitle, { color: theme.textSecondary }]}>Smallest size variant</Text>
					<NavButtons navigation={navigation} current="compact" />
				</Transition.View>
			</View>
		</BoundsIndicator>
	);
}

/**
 * ScreenB - Medium height panel (edge-to-edge, no horizontal padding)
 */
export function ScreenMedium({ navigation }: Props) {
	const theme = useTheme();
	return (
		<BoundsIndicator>
			<View style={styles.containerBottomEdge}>
				<Transition.View
					sharedBoundTag="FLOATING_ELEMENT"
					style={[styles.card, styles.cardMediumEdge, { backgroundColor: theme.surface }]}
				>
					<View style={[styles.handle, { backgroundColor: theme.handle }]} />
					<Text style={[styles.title, { color: theme.text }]}>Medium</Text>
					<Text style={[styles.subtitle, { color: theme.textSecondary }]}>
						Edge-to-edge panel anchored to bottom
					</Text>
					<View style={[styles.contentBlock, { backgroundColor: theme.surfaceElevated }]}>
						<Text style={[styles.contentText, { color: theme.textSecondary }]}>
							This panel is full-width with no horizontal padding. Tests x
							position and width changes during transitions.
						</Text>
					</View>
					<NavButtons navigation={navigation} current="medium" />
				</Transition.View>
			</View>
		</BoundsIndicator>
	);
}

/**
 * ScreenC - Large panel
 */
export function ScreenLarge({ navigation }: Props) {
	const theme = useTheme();
	return (
		<BoundsIndicator>
			<View style={styles.containerBottom}>
				<Transition.View
					sharedBoundTag="FLOATING_ELEMENT"
					style={[styles.card, styles.cardLarge, { backgroundColor: theme.surface }]}
				>
					<View style={[styles.handle, { backgroundColor: theme.handle }]} />
					<Text style={[styles.title, { color: theme.text }]}>Large</Text>
					<Text style={[styles.subtitle, { color: theme.textSecondary }]}>
						Even more space for complex content
					</Text>
					<View style={[styles.contentBlock, { backgroundColor: theme.surfaceElevated }]}>
						<Text style={[styles.contentText, { color: theme.textSecondary }]}>
							The large variant provides substantial room for content. You could
							fit multiple sections, images, or interactive elements here.
						</Text>
					</View>
					<View style={[styles.contentBlock, { backgroundColor: theme.surfaceElevated }]}>
						<Text style={[styles.contentText, { color: theme.textSecondary }]}>
							This second block shows how content can stack vertically in this
							larger container.
						</Text>
					</View>
					<NavButtons navigation={navigation} current="large" />
				</Transition.View>
			</View>
		</BoundsIndicator>
	);
}

/**
 * ScreenD - Fullscreen
 */
export function ScreenFullscreen({ navigation }: Props) {
	const theme = useTheme();
	return (
		<BoundsIndicator>
			<Transition.View
				sharedBoundTag="FLOATING_ELEMENT"
				style={[styles.card, styles.cardFullscreen, { backgroundColor: theme.surface }]}
			>
				<View style={[styles.handle, { backgroundColor: theme.handle }]} />
				<Text style={[styles.title, { color: theme.text }]}>Fullscreen</Text>
				<Text style={[styles.subtitle, { color: theme.textSecondary }]}>Takes up the entire screen</Text>

				<Transition.ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.scrollContent}
				>
					{[1, 2, 3, 4, 5].map((i) => (
						<View key={i} style={[styles.scrollCard, { backgroundColor: theme.surfaceElevated }]}>
							<Text style={[styles.scrollCardTitle, { color: theme.text }]}>Item {i}</Text>
							<Text style={[styles.scrollCardText, { color: theme.textSecondary }]}>
								Scrollable content in fullscreen mode
							</Text>
						</View>
					))}
				</Transition.ScrollView>

				<View style={[styles.bottomNav, { borderTopColor: theme.separator }]}>
					<NavButtons navigation={navigation} current="fullscreen" />
				</View>
			</Transition.View>
		</BoundsIndicator>
	);
}

/**
 * ScreenE - Nested navigator example
 * Contains its own push-based stack inside the replace-based outer stack
 */
export function ScreenNested(_props: Props) {
	return <NestedStackScreen />;
}

const styles = StyleSheet.create({
	containerBottom: {
		flex: 1,
		justifyContent: "flex-end",
		padding: 16,
		paddingBottom: 32,
	},
	containerBottomEdge: {
		flex: 1,
		justifyContent: "flex-end",
		// No horizontal padding - edge-to-edge
	},
	card: {
		borderRadius: 24,
		padding: 20,
	},
	cardCompact: {
		// Small bar ~120px
	},
	cardMediumEdge: {
		minHeight: 280,
		borderRadius: 24,
		borderBottomLeftRadius: 0,
		borderBottomRightRadius: 0,
	},
	cardLarge: {
		minHeight: 420,
	},
	cardFullscreen: {
		flex: 1,
		margin: 0,
		borderRadius: 0,
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
	contentBlock: {
		borderRadius: 14,
		padding: 16,
		marginBottom: 16,
	},
	contentText: {
		fontSize: 14,
		lineHeight: 20,
	},
	navRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "center",
		gap: 8,
		marginTop: 8,
	},
	navButton: {
		paddingHorizontal: 14,
		paddingVertical: 8,
		borderRadius: 999,
	},
	navButtonText: {
		fontSize: 13,
		fontWeight: "600",
	},
	scrollView: {
		flex: 1,
		marginVertical: 16,
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
	},
	bottomNav: {
		paddingTop: 16,
		borderTopWidth: 1,
	},
});
