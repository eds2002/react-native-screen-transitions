import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import Transition, { snapTo } from "react-native-screen-transitions";
import { useTheme } from "@/theme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const SNAP_TARGETS = [
	{ index: 0, label: "30%" },
	{ index: 1, label: "60%" },
	{ index: 2, label: "100%" },
];

const ITEMS = Array.from({ length: 20 }, (_, index) => ({
	id: index,
	title: `Feed Row ${index + 1}`,
	description: "Scroll the list, then drag the sheet to test lock behavior",
}));

export default function SnapLockToggleScreen() {
	const navigation = useNavigation<any>();
	const [locked, setLocked] = useState(true);
	const [gesturesEnabled, setGesturesEnabled] = useState(true);
	const theme = useTheme();

	useEffect(() => {
		navigation.setOptions({
			gestureEnabled: gesturesEnabled,
			gestureSnapLocked: locked,
		});
	}, [gesturesEnabled, locked, navigation]);

	return (
		<View
			style={[
				styles.container,
				{ maxHeight: SCREEN_HEIGHT, backgroundColor: theme.bg },
			]}
		>
			<View style={[styles.handle, { backgroundColor: theme.handle }]} />
			<Text style={[styles.title, { color: theme.text }]}>Snap Lock</Text>
			<Text style={[styles.subtitle, { color: theme.textSecondary }]}>
				Scroll coordination with runtime gesture and lock controls
			</Text>

			<View style={styles.statusGrid}>
				<StatusPill
					label="Snapping"
					value={locked ? "LOCKED" : "UNLOCKED"}
					active={locked}
				/>
				<StatusPill
					label="Gestures"
					value={gesturesEnabled ? "ENABLED" : "DISABLED"}
					active={gesturesEnabled}
				/>
			</View>

			<View style={styles.toggleRow}>
				<Pressable
					testID="toggle-lock"
					style={[
						styles.toggleButton,
						{ backgroundColor: locked ? theme.activePill : theme.pill },
					]}
					onPress={() => setLocked((value) => !value)}
				>
					<Text
						style={[
							styles.toggleText,
							{ color: locked ? theme.activePillText : theme.pillText },
						]}
					>
						{locked ? "Unlock Snap" : "Lock Snap"}
					</Text>
				</Pressable>
				<Pressable
					testID="toggle-gestures"
					style={[
						styles.toggleButton,
						{
							backgroundColor: gesturesEnabled ? theme.activePill : theme.pill,
						},
					]}
					onPress={() => setGesturesEnabled((value) => !value)}
				>
					<Text
						style={[
							styles.toggleText,
							{
								color: gesturesEnabled ? theme.activePillText : theme.pillText,
							},
						]}
					>
						{gesturesEnabled ? "Disable Gestures" : "Enable Gestures"}
					</Text>
				</Pressable>
			</View>

			<View style={styles.snapButtons}>
				{SNAP_TARGETS.map((target) => (
					<Pressable
						key={target.index}
						testID={`snap-lock-snap-to-${target.index}`}
						style={({ pressed }) => [
							styles.snapButton,
							{
								backgroundColor: pressed
									? theme.actionButtonPressed
									: theme.actionButton,
							},
						]}
						onPress={() => snapTo(target.index)}
					>
						<Text
							style={[styles.snapButtonText, { color: theme.actionButtonText }]}
						>
							Snap {target.label}
						</Text>
					</Pressable>
				))}
			</View>

			<View style={[styles.card, { backgroundColor: theme.card }]}>
				<Text style={[styles.cardTitle, { color: theme.infoBoxLabel }]}>
					Expected
				</Text>
				<Text style={[styles.item, { color: theme.textSecondary }]}>
					- Lock enabled: list scroll works, sheet drag cannot change snap
					points
				</Text>
				<Text style={[styles.item, { color: theme.textSecondary }]}>
					- Gestures disabled: no sheet drag or swipe dismiss
				</Text>
				<Text style={[styles.item, { color: theme.textSecondary }]}>
					- Programmatic snap controls always work
				</Text>
			</View>

			<Transition.ScrollView
				testID="snap-lock-scroll"
				style={styles.scroll}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				{ITEMS.map((item) => (
					<View
						key={item.id}
						style={[styles.row, { backgroundColor: theme.surfaceElevated }]}
					>
						<Text style={[styles.rowTitle, { color: theme.text }]}>
							{item.title}
						</Text>
						<Text
							style={[styles.rowDescription, { color: theme.textSecondary }]}
						>
							{item.description}
						</Text>
					</View>
				))}
			</Transition.ScrollView>
		</View>
	);
}

function StatusPill({
	label,
	value,
	active,
}: {
	label: string;
	value: string;
	active: boolean;
}) {
	const theme = useTheme();

	return (
		<View style={styles.statusItem}>
			<Text style={[styles.statusLabel, { color: theme.textSecondary }]}>
				{label}
			</Text>
			<View
				style={[
					styles.statusPill,
					{ backgroundColor: active ? theme.activePill : theme.pill },
				]}
			>
				<Text
					style={[
						styles.statusText,
						{ color: active ? theme.activePillText : theme.pillText },
					]}
				>
					{value}
				</Text>
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
	statusGrid: {
		flexDirection: "row",
		gap: 10,
		marginBottom: 12,
	},
	statusItem: {
		flex: 1,
		gap: 6,
	},
	statusLabel: {
		fontSize: 12,
		fontWeight: "800",
	},
	statusPill: {
		alignItems: "center",
		paddingHorizontal: 10,
		paddingVertical: 7,
		borderRadius: 999,
	},
	statusText: {
		fontSize: 11,
		fontWeight: "900",
	},
	toggleRow: {
		flexDirection: "row",
		gap: 10,
		marginBottom: 12,
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
	snapButtons: {
		flexDirection: "row",
		gap: 8,
		marginBottom: 12,
	},
	snapButton: {
		flex: 1,
		borderRadius: 999,
		alignItems: "center",
		paddingVertical: 9,
	},
	snapButtonText: {
		fontSize: 12,
		fontWeight: "800",
	},
	card: {
		borderRadius: 14,
		padding: 14,
		marginBottom: 12,
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
	scroll: {
		flex: 1,
	},
	scrollContent: {
		paddingBottom: 16,
	},
	row: {
		borderRadius: 14,
		padding: 14,
		marginBottom: 8,
	},
	rowTitle: {
		fontSize: 14,
		fontWeight: "800",
		marginBottom: 4,
	},
	rowDescription: {
		fontSize: 12,
		fontWeight: "600",
	},
});
