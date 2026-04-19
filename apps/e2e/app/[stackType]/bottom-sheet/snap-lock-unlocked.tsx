import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { snapTo } from "react-native-screen-transitions";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const SNAP_TARGETS = [
	{ index: 0, label: "25%" },
	{ index: 1, label: "50%" },
	{ index: 2, label: "75%" },
	{ index: 3, label: "100%" },
];

export default function SnapLockUnlockedScreen() {
	return (
		<View style={[styles.container, { maxHeight: SCREEN_HEIGHT }]}>
			<View style={styles.handle} />
			<Text style={styles.title}>Snap Lock: Unlocked</Text>
			<Text style={styles.subtitle}>
				Baseline for gesture behavior comparisons
			</Text>

			<View style={styles.card}>
				<Text style={styles.cardTitle}>Expected</Text>
				<Text style={styles.item}>- Drag up/down between all snap points</Text>
				<Text style={styles.item}>
					- Swipe down from min point dismisses screen
				</Text>
				<Text style={styles.item}>- Programmatic snapTo works as usual</Text>
			</View>

			<View style={styles.buttons}>
				{SNAP_TARGETS.map((target) => (
					<Pressable
						key={target.index}
						testID={`unlocked-snap-to-${target.index}`}
						style={styles.button}
						onPress={() => snapTo(target.index)}
					>
						<Text style={styles.buttonText}>{target.label}</Text>
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
		backgroundColor: "#0F1A2B",
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
	},
	handle: {
		alignSelf: "center",
		width: 44,
		height: 5,
		borderRadius: 3,
		backgroundColor: "rgba(255,255,255,0.2)",
		marginBottom: 18,
	},
	title: {
		fontSize: 28,
		fontWeight: "900",
		color: "#fff",
		marginBottom: 6,
	},
	subtitle: {
		fontSize: 14,
		fontWeight: "600",
		color: "rgba(255,255,255,0.55)",
		marginBottom: 16,
	},
	card: {
		backgroundColor: "rgba(255,255,255,0.08)",
		borderRadius: 16,
		padding: 14,
		marginBottom: 16,
	},
	cardTitle: {
		fontSize: 13,
		fontWeight: "800",
		color: "#8ab4ff",
		marginBottom: 8,
	},
	item: {
		fontSize: 13,
		fontWeight: "600",
		color: "rgba(255,255,255,0.75)",
		marginBottom: 6,
	},
	buttons: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
	button: {
		backgroundColor: "rgba(138,180,255,0.18)",
		borderRadius: 12,
		paddingHorizontal: 14,
		paddingVertical: 9,
	},
	buttonText: {
		fontSize: 12,
		fontWeight: "800",
		color: "#d7e7ff",
	},
});
