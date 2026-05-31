import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "@/theme";

export type GestureBehavior = {
	direction: "down" | "up" | "right" | "left" | "pinch";
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
	down: "\u2193",
	up: "\u2191",
	right: "\u2192",
	left: "\u2190",
	pinch: "\u2922",
};

export function GestureInfo({
	title,
	structure,
	behaviors,
	note,
}: GestureInfoProps) {
	const theme = useTheme();

	return (
		<View style={styles.container}>
			<Text style={[styles.title, { color: theme.text }]}>{title}</Text>

			<View style={[styles.structureBox, { backgroundColor: theme.infoBox }]}>
				<Text style={[styles.structureLabel, { color: theme.infoBoxLabel }]}>
					Structure
				</Text>
				<Text style={[styles.structure, { color: theme.text }]}>
					{structure}
				</Text>
			</View>

			<View style={[styles.behaviorBox, { backgroundColor: theme.infoBox }]}>
				<Text style={[styles.behaviorLabel, { color: theme.infoBoxLabel }]}>
					Expected Behavior
				</Text>
				<View style={styles.table}>
					<View
						style={[styles.tableHeader, { borderBottomColor: theme.separator }]}
					>
						<Text
							style={[
								styles.tableCell,
								styles.headerCell,
								styles.dirCell,
								{ color: theme.textSecondary },
							]}
						>
							Gesture
						</Text>
						<Text
							style={[
								styles.tableCell,
								styles.headerCell,
								styles.ownerCell,
								{ color: theme.textSecondary },
							]}
						>
							Owner
						</Text>
						<Text
							style={[
								styles.tableCell,
								styles.headerCell,
								styles.resultCell,
								{ color: theme.textSecondary },
							]}
						>
							Result
						</Text>
					</View>
					{behaviors.map((b) => (
						<View
							key={`${b.direction}:${b.owner ?? "none"}:${b.result}`}
							style={styles.tableRow}
						>
							<Text
								style={[
									styles.tableCell,
									styles.dirCell,
									{ color: theme.text },
								]}
							>
								{DIRECTION_SYMBOLS[b.direction]}
							</Text>
							<Text
								style={[
									styles.tableCell,
									styles.ownerCell,
									{ color: theme.text },
								]}
							>
								{b.owner ?? "\u2014"}
							</Text>
							<Text
								style={[
									styles.tableCell,
									styles.resultCell,
									{ color: theme.text },
								]}
							>
								{b.result}
							</Text>
						</View>
					))}
				</View>
			</View>

			{note && (
				<View style={[styles.noteBox, { backgroundColor: theme.noteBox }]}>
					<Text style={[styles.note, { color: theme.noteText }]}>{note}</Text>
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
	},
	structureBox: {
		borderRadius: 12,
		padding: 12,
	},
	structureLabel: {
		fontSize: 10,
		fontWeight: "600",
		textTransform: "uppercase",
		letterSpacing: 1,
		marginBottom: 6,
	},
	structure: {
		fontSize: 13,
		fontFamily: "monospace",
		lineHeight: 20,
	},
	behaviorBox: {
		borderRadius: 12,
		padding: 12,
	},
	behaviorLabel: {
		fontSize: 10,
		fontWeight: "600",
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
		paddingBottom: 6,
		marginBottom: 4,
	},
	tableRow: {
		flexDirection: "row",
		paddingVertical: 4,
	},
	tableCell: {
		fontSize: 13,
	},
	headerCell: {
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
		borderRadius: 12,
		padding: 12,
	},
	note: {
		fontSize: 12,
		lineHeight: 18,
	},
});
