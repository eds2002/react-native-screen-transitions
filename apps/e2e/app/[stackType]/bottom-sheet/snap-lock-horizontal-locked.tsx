import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { snapTo } from "react-native-screen-transitions";
import { useTheme } from "@/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const SNAP_TARGETS = [
	{ index: 0, label: "35%" },
	{ index: 1, label: "65%" },
	{ index: 2, label: "100%" },
];

export default function SnapLockHorizontalLockedScreen() {
	const theme = useTheme();

	return (
		<View style={[styles.container, { maxWidth: SCREEN_WIDTH, backgroundColor: theme.bg }]}>
			<View style={[styles.handle, { backgroundColor: theme.handle }]} />
			<Text style={[styles.title, { color: theme.text }]}>Snap Lock: Horizontal</Text>
			<Text style={[styles.subtitle, { color: theme.textSecondary }]}>
				Drawer axis validation with lock enabled
			</Text>

			<View style={[styles.card, { backgroundColor: theme.card }]}>
				<Text style={[styles.cardTitle, { color: theme.infoBoxLabel }]}>Expected</Text>
				<Text style={[styles.item, { color: theme.textSecondary }]}>
					- Horizontal expand/collapse snapping is locked
				</Text>
				<Text style={[styles.item, { color: theme.textSecondary }]}>
					- Dismiss gesture still works when allowed
				</Text>
				<Text style={[styles.item, { color: theme.textSecondary }]}>
					- Programmatic snapTo still moves drawer
				</Text>
			</View>

			<View style={styles.buttons}>
				{SNAP_TARGETS.map((target) => (
					<Pressable
						key={target.index}
						testID={`horizontal-locked-snap-to-${target.index}`}
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
