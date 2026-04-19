import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { snapTo } from "react-native-screen-transitions";
import { useTheme } from "@/theme";

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
	const theme = useTheme();

	useEffect(() => {
		navigation.setOptions({ gestureSnapLocked: locked });
	}, [locked, navigation]);

	return (
		<View style={[styles.container, { maxHeight: SCREEN_HEIGHT, backgroundColor: theme.bg }]}>
			<View style={[styles.handle, { backgroundColor: theme.handle }]} />
			<Text style={[styles.title, { color: theme.text }]}>Snap Lock: Dynamic Toggle</Text>
			<Text style={[styles.subtitle, { color: theme.textSecondary }]}>
				Switch lock ON/OFF while this screen is open
			</Text>

			<View style={styles.statusRow}>
				<Text style={[styles.statusLabel, { color: theme.textSecondary }]}>Current lock state:</Text>
				<View
					testID="toggle-lock-status"
					style={[
						styles.statusPill,
						{ backgroundColor: locked ? theme.activePill : theme.pill },
					]}
				>
					<Text style={[styles.statusText, { color: locked ? theme.activePillText : theme.pillText }]}>
						{locked ? "LOCKED" : "UNLOCKED"}
					</Text>
				</View>
			</View>

			<View style={styles.toggleRow}>
				<Pressable
					testID="toggle-lock-on"
					style={[styles.toggleButton, { backgroundColor: locked ? theme.activePill : theme.pill }]}
					onPress={() => setLocked(true)}
				>
					<Text style={[styles.toggleText, { color: locked ? theme.activePillText : theme.pillText }]}>Lock ON</Text>
				</Pressable>
				<Pressable
					testID="toggle-lock-off"
					style={[styles.toggleButton, { backgroundColor: !locked ? theme.activePill : theme.pill }]}
					onPress={() => setLocked(false)}
				>
					<Text style={[styles.toggleText, { color: !locked ? theme.activePillText : theme.pillText }]}>Lock OFF</Text>
				</Pressable>
			</View>

			<View style={[styles.card, { backgroundColor: theme.card }]}>
				<Text style={[styles.cardTitle, { color: theme.infoBoxLabel }]}>Expected</Text>
				<Text style={[styles.item, { color: theme.textSecondary }]}>- Lock ON: no gesture snap transitions</Text>
				<Text style={[styles.item, { color: theme.textSecondary }]}>- Lock OFF: normal snap gestures resume</Text>
				<Text style={[styles.item, { color: theme.textSecondary }]}>
					- Dismiss remains available when allowed
				</Text>
			</View>

			<View style={styles.buttons}>
				{SNAP_TARGETS.map((target) => (
					<Pressable
						key={target.index}
						testID={`toggle-snap-to-${target.index}`}
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
	},
	statusPill: {
		paddingHorizontal: 10,
		paddingVertical: 5,
		borderRadius: 999,
	},
	statusText: {
		fontSize: 11,
		fontWeight: "900",
	},
	toggleRow: {
		flexDirection: "row",
		gap: 10,
		marginBottom: 14,
	},
	toggleButton: {
		flex: 1,
		borderRadius: 999,
		paddingVertical: 10,
		alignItems: "center",
	},
	toggleText: {
		fontSize: 12,
		fontWeight: "800",
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
