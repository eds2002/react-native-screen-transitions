import { ScrollView, StyleSheet, Text, View } from "react-native";
import Transition from "react-native-screen-transitions";
import type { ComponentStackScreenProps } from "react-native-screen-transitions/component-stack";
import { BoundsIndicator } from "./bounds-indicator";

type Props = ComponentStackScreenProps<{
	idle: undefined;
	expanded: undefined;
}>;

/**
 * ActiveContent - FINAL state component
 *
 * Fullscreen content with a header that shares the same
 * sharedBoundTag as the floating bar. The bounds API
 * animates the transition between them.
 */
export function ActiveContent({ navigation }: Props) {
	return (
		<BoundsIndicator>
			<Transition.View
				sharedBoundTag="FLOATING_ELEMENT"
				style={[styles.container]}
			>
				{/* Scrollable content */}
				<Transition.ScrollView
					style={styles.scrollView}
					contentContainerStyle={styles.scrollContent}
				>
					<Text style={styles.sectionTitle}>Content</Text>
					<Text style={styles.paragraph}>
						This content fills the screen. The header above morphed from the
						floating bar using the bounds API. Notice how the green border
						indicator shows the active viewing area.
					</Text>

					{/* Sample cards to show content */}
					{[1, 2, 3, 4, 5].map((i) => (
						<View key={i} style={styles.card}>
							<Text style={styles.cardTitle}>Card {i}</Text>
							<Text style={styles.cardDescription}>
								Sample content card demonstrating scrollable content in the
								expanded view.
							</Text>
						</View>
					))}

					{/* Close button */}
					<Transition.Pressable
						style={styles.closeButton}
						onPress={() => navigation.goBack()}
					>
						<Text style={styles.closeButtonText}>Close</Text>
					</Transition.Pressable>
				</Transition.ScrollView>
			</Transition.View>
		</BoundsIndicator>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#1a1a1a",
	},
	header: {
		backgroundColor: "#1e1e1e",
		borderBottomLeftRadius: 24,
		borderBottomRightRadius: 24,
		padding: 20,
		alignItems: "center",
		borderWidth: 1,
		borderColor: "#333",
		borderTopWidth: 0,
	},
	handle: {
		width: 40,
		height: 4,
		backgroundColor: "#555",
		borderRadius: 2,
		marginBottom: 16,
	},
	title: {
		fontSize: 20,
		fontWeight: "700",
		color: "#fff",
		marginBottom: 4,
	},
	subtitle: {
		fontSize: 14,
		color: "#888",
	},
	scrollView: {
		flex: 1,
	},
	scrollContent: {
		padding: 20,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: "#fff",
		marginBottom: 12,
	},
	paragraph: {
		fontSize: 14,
		color: "#aaa",
		lineHeight: 22,
		marginBottom: 24,
	},
	card: {
		backgroundColor: "#252525",
		borderRadius: 16,
		padding: 16,
		marginBottom: 12,
		borderWidth: 1,
		borderColor: "#333",
	},
	cardTitle: {
		fontSize: 16,
		fontWeight: "600",
		color: "#fff",
		marginBottom: 4,
	},
	cardDescription: {
		fontSize: 14,
		color: "#888",
	},
	closeButton: {
		backgroundColor: "#e94560",
		borderRadius: 12,
		padding: 16,
		alignItems: "center",
		marginTop: 12,
	},
	closeButtonText: {
		fontSize: 16,
		fontWeight: "600",
		color: "#fff",
	},
});
