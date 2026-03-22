import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { snapTo } from "react-native-screen-transitions";
import { useTheme } from "@/theme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const SNAP_TARGETS = [
	{ index: 0, label: "25%" },
	{ index: 1, label: "60%" },
	{ index: 2, label: "100%" },
];

export default function SnapLockLockedNoDismissScreen() {
	const theme = useTheme();

	return (
		<View style={[styles.container, { maxHeight: SCREEN_HEIGHT, backgroundColor: theme.bg }]}>
			<View style={[styles.handle, { backgroundColor: theme.handle }]} />
			<Text style={[styles.title, { color: theme.text }]}>Snap Lock: No Dismiss</Text>
			<Text style={[styles.subtitle, { color: theme.textSecondary }]}>
				gestureEnabled is false + snap lock true
			</Text>

			<View style={[styles.card, { backgroundColor: theme.card }]}>
				<Text style={[styles.cardTitle, { color: theme.infoBoxLabel }]}>Expected</Text>
				<Text style={[styles.item, { color: theme.textSecondary }]}>- No swipe dismiss (gestures disabled)</Text>
				<Text style={[styles.item, { color: theme.textSecondary }]}>- No gesture snap transitions</Text>
				<Text style={[styles.item, { color: theme.textSecondary }]}>- Programmatic snapTo still works</Text>
			</View>

			<View style={styles.buttons}>
				{SNAP_TARGETS.map((target) => (
					<Pressable
						key={target.index}
						testID={`no-dismiss-snap-to-${target.index}`}
						style={({ pressed }) => [styles.button, { backgroundColor: pressed ? theme.actionButtonPressed : theme.actionButton }]}
						onPress={() => snapTo(target.index)}
					>
						<Text style={[styles.buttonText, { color: theme.actionButtonText }]}>{target.label}</Text>
					</Pressable>
				))}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		paddingHorizontal: 20,
		paddingTop: 12,
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
	},
	handle: {
		alignSelf: "center",
		width: 44,
		height: 5,
		borderRadius: 3,
		marginBottom: 18,
	},
	title: {
		fontSize: 28,
		fontWeight: "900",
		marginBottom: 6,
	},
	subtitle: {
		fontSize: 14,
		fontWeight: "600",
		marginBottom: 16,
	},
	card: {
		borderRadius: 14,
		padding: 14,
		marginBottom: 16,
	},
	cardTitle: {
		fontSize: 13,
		fontWeight: "800",
		marginBottom: 8,
	},
	item: {
		fontSize: 13,
		fontWeight: "600",
		marginBottom: 6,
	},
	buttons: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
	button: {
		borderRadius: 999,
		paddingHorizontal: 14,
		paddingVertical: 9,
	},
	buttonText: {
		fontSize: 12,
		fontWeight: "800",
	},
});
