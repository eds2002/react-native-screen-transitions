import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { snapTo } from "react-native-screen-transitions";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const SNAP_TARGETS = [
	{ index: 0, label: "25%" },
	{ index: 1, label: "50%" },
	{ index: 2, label: "75%" },
	{ index: 3, label: "100%" },
];

export default function SnapLockToggleScreen() {
	const navigation = useNavigation<any>();
	const [locked, setLocked] = useState(true);

	useEffect(() => {
		navigation.setOptions({ gestureSnapLocked: locked });
	}, [locked, navigation]);

	return (
		<View style={[styles.container, { maxHeight: SCREEN_HEIGHT }]}>
			<View style={styles.handle} />
			<Text style={styles.title}>Snap Lock: Dynamic Toggle</Text>
			<Text style={styles.subtitle}>
				Switch lock ON/OFF while this screen is open
			</Text>

			<View style={styles.statusRow}>
				<Text style={styles.statusLabel}>Current lock state:</Text>
				<View
					testID="toggle-lock-status"
					style={[
						styles.statusPill,
						locked ? styles.statusLocked : styles.statusOpen,
					]}
				>
					<Text style={styles.statusText}>
						{locked ? "LOCKED" : "UNLOCKED"}
					</Text>
				</View>
			</View>

			<View style={styles.toggleRow}>
				<Pressable
					testID="toggle-lock-on"
					style={[styles.toggleButton, locked && styles.toggleButtonActive]}
					onPress={() => setLocked(true)}
				>
					<Text style={styles.toggleText}>Lock ON</Text>
				</Pressable>
				<Pressable
					testID="toggle-lock-off"
					style={[styles.toggleButton, !locked && styles.toggleButtonActive]}
					onPress={() => setLocked(false)}
				>
					<Text style={styles.toggleText}>Lock OFF</Text>
				</Pressable>
			</View>

			<View style={styles.card}>
				<Text style={styles.cardTitle}>Expected</Text>
				<Text style={styles.item}>- Lock ON: no gesture snap transitions</Text>
				<Text style={styles.item}>- Lock OFF: normal snap gestures resume</Text>
				<Text style={styles.item}>
					- Dismiss remains available when allowed
				</Text>
			</View>

			<View style={styles.buttons}>
				{SNAP_TARGETS.map((target) => (
					<Pressable
						key={target.index}
						testID={`toggle-snap-to-${target.index}`}
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
		backgroundColor: "#1c162c",
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
		marginBottom: 14,
	},
	statusRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		marginBottom: 12,
	},
	statusLabel: {
		fontSize: 13,
		fontWeight: "700",
		color: "rgba(255,255,255,0.7)",
	},
	statusPill: {
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: 999,
	},
	statusLocked: {
		backgroundColor: "rgba(232,67,147,0.22)",
	},
	statusOpen: {
		backgroundColor: "rgba(116,185,255,0.2)",
	},
	statusText: {
		fontSize: 11,
		fontWeight: "900",
		color: "#fff",
	},
	toggleRow: {
		flexDirection: "row",
		gap: 10,
		marginBottom: 14,
	},
	toggleButton: {
		flex: 1,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.2)",
		paddingVertical: 10,
		alignItems: "center",
	},
	toggleButtonActive: {
		backgroundColor: "rgba(255,255,255,0.12)",
	},
	toggleText: {
		fontSize: 12,
		fontWeight: "800",
		color: "#fff",
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
		color: "#d5b4ff",
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
		backgroundColor: "rgba(165,120,255,0.24)",
		borderRadius: 12,
		paddingHorizontal: 14,
		paddingVertical: 9,
	},
	buttonText: {
		fontSize: 12,
		fontWeight: "800",
		color: "#f1e6ff",
	},
});
