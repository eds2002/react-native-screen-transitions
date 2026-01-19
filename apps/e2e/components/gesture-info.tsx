import { StyleSheet, Text, View } from "react-native";

export type GestureBehavior = {
	direction: "down" | "up" | "right" | "left";
	owner: string | null;
	result: string;
};

interface GestureInfoProps {
	title: string;
	structure: string;
	behaviors: GestureBehavior[];
	note?: string;
}

const DIRECTION_SYMBOLS: Record<GestureBehavior["direction"], string> = {
	down: "↓",
	up: "↑",
	right: "→",
	left: "←",
};

export function GestureInfo({
	title,
	structure,
	behaviors,
	note,
}: GestureInfoProps) {
	return (
		<View style={styles.container}>
			<Text style={styles.title}>{title}</Text>

			<View style={styles.structureBox}>
				<Text style={styles.structureLabel}>Structure</Text>
				<Text style={styles.structure}>{structure}</Text>
			</View>

			<View style={styles.behaviorBox}>
				<Text style={styles.behaviorLabel}>Expected Behavior</Text>
				<View style={styles.table}>
					<View style={styles.tableHeader}>
						<Text style={[styles.tableCell, styles.headerCell, styles.dirCell]}>
							Drag
						</Text>
						<Text
							style={[styles.tableCell, styles.headerCell, styles.ownerCell]}
						>
							Owner
						</Text>
						<Text
							style={[styles.tableCell, styles.headerCell, styles.resultCell]}
						>
							Result
						</Text>
					</View>
					{behaviors.map((b, i) => (
						<View key={i} style={styles.tableRow}>
							<Text style={[styles.tableCell, styles.dirCell]}>
								{DIRECTION_SYMBOLS[b.direction]}
							</Text>
							<Text style={[styles.tableCell, styles.ownerCell]}>
								{b.owner ?? "—"}
							</Text>
							<Text style={[styles.tableCell, styles.resultCell]}>
								{b.result}
							</Text>
						</View>
					))}
				</View>
			</View>

			{note && (
				<View style={styles.noteBox}>
					<Text style={styles.note}>{note}</Text>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: 16,
		gap: 12,
	},
	title: {
		fontSize: 18,
		fontWeight: "700",
		color: "#fff",
	},
	structureBox: {
		backgroundColor: "rgba(74, 158, 255, 0.1)",
		borderRadius: 8,
		padding: 12,
		borderWidth: 1,
		borderColor: "rgba(74, 158, 255, 0.3)",
	},
	structureLabel: {
		fontSize: 10,
		fontWeight: "600",
		color: "#4a9eff",
		textTransform: "uppercase",
		letterSpacing: 1,
		marginBottom: 6,
	},
	structure: {
		fontSize: 13,
		color: "#fff",
		fontFamily: "monospace",
		lineHeight: 20,
	},
	behaviorBox: {
		backgroundColor: "rgba(255, 255, 255, 0.05)",
		borderRadius: 8,
		padding: 12,
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.1)",
	},
	behaviorLabel: {
		fontSize: 10,
		fontWeight: "600",
		color: "#888",
		textTransform: "uppercase",
		letterSpacing: 1,
		marginBottom: 8,
	},
	table: {
		gap: 4,
	},
	tableHeader: {
		flexDirection: "row",
		borderBottomWidth: 1,
		borderBottomColor: "rgba(255, 255, 255, 0.1)",
		paddingBottom: 6,
		marginBottom: 4,
	},
	tableRow: {
		flexDirection: "row",
		paddingVertical: 4,
	},
	tableCell: {
		fontSize: 13,
		color: "#fff",
	},
	headerCell: {
		color: "#888",
		fontWeight: "600",
		fontSize: 11,
		textTransform: "uppercase",
	},
	dirCell: {
		width: 50,
		textAlign: "center",
	},
	ownerCell: {
		width: 100,
	},
	resultCell: {
		flex: 1,
	},
	noteBox: {
		backgroundColor: "rgba(255, 193, 7, 0.1)",
		borderRadius: 8,
		padding: 12,
		borderWidth: 1,
		borderColor: "rgba(255, 193, 7, 0.3)",
	},
	note: {
		fontSize: 12,
		color: "#ffc107",
		lineHeight: 18,
	},
});
