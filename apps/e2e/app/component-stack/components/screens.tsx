import { StyleSheet, Text, View } from "react-native";
import Transition from "react-native-screen-transitions";
import type { ComponentStackScreenProps } from "react-native-screen-transitions/component-stack";
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
	return (
		<View style={styles.navRow}>
			{NAV_BUTTONS.map(({ name, label, type }) => (
				<Transition.Pressable
					key={name}
					style={[styles.navButton, current === name && styles.navButtonActive]}
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
							current === name && styles.navButtonTextActive,
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
	return (
		<BoundsIndicator>
			<View style={styles.containerBottom}>
				<Transition.View
					sharedBoundTag="FLOATING_ELEMENT"
					style={[styles.card, styles.cardCompact]}
				>
					<View style={styles.handle} />
					<Text style={styles.title}>Compact</Text>
					<Text style={styles.subtitle}>Smallest size variant</Text>
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
	return (
		<BoundsIndicator>
			<View style={styles.containerBottomEdge}>
				<Transition.View
					sharedBoundTag="FLOATING_ELEMENT"
					style={[styles.card, styles.cardMediumEdge]}
				>
					<View style={styles.handle} />
					<Text style={styles.title}>Medium</Text>
					<Text style={styles.subtitle}>
						Edge-to-edge panel anchored to bottom
					</Text>
					<View style={styles.contentBlock}>
						<Text style={styles.contentText}>
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
	return (
		<BoundsIndicator>
			<View style={styles.containerBottom}>
				<Transition.View
					sharedBoundTag="FLOATING_ELEMENT"
					style={[styles.card, styles.cardLarge]}
				>
					<View style={styles.handle} />
					<Text style={styles.title}>Large</Text>
					<Text style={styles.subtitle}>
						Even more space for complex content
					</Text>
					<View style={styles.contentBlock}>
						<Text style={styles.contentText}>
							The large variant provides substantial room for content. You could
							fit multiple sections, images, or interactive elements here.
						</Text>
					</View>
					<View style={styles.contentBlock}>
						<Text style={styles.contentText}>
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
	return (
		<BoundsIndicator>
			<Transition.View
				sharedBoundTag="FLOATING_ELEMENT"
				style={[styles.card, styles.cardFullscreen]}
			>
				<View style={styles.handle} />
				<Text style={styles.title}>Fullscreen</Text>
				<Text style={styles.subtitle}>Takes up the entire screen</Text>

				<Transition.ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.scrollContent}
				>
					{[1, 2, 3, 4, 5].map((i) => (
						<View key={i} style={styles.scrollCard}>
							<Text style={styles.scrollCardTitle}>Item {i}</Text>
							<Text style={styles.scrollCardText}>
								Scrollable content in fullscreen mode
							</Text>
						</View>
					))}
				</Transition.ScrollView>

				<View style={styles.bottomNav}>
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
		backgroundColor: "#1a1a1a",
		borderRadius: 24,
		padding: 20,
		borderWidth: 1,
		borderColor: "#333",
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
	contentBlock: {
		backgroundColor: "#252525",
		borderRadius: 12,
		padding: 16,
		marginBottom: 16,
	},
	contentText: {
		fontSize: 14,
		color: "#aaa",
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
		borderRadius: 16,
		backgroundColor: "#333",
	},
	navButtonActive: {
		backgroundColor: "#e94560",
	},
	navButtonText: {
		fontSize: 13,
		fontWeight: "600",
		color: "#888",
	},
	navButtonTextActive: {
		color: "#fff",
	},
	scrollView: {
		flex: 1,
		marginVertical: 16,
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
	},
	bottomNav: {
		paddingTop: 16,
		borderTopWidth: 1,
		borderTopColor: "#333",
	},
});
