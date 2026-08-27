import { StyleSheet, Text, View } from "react-native";

export function StackingCardContent({
	compact = false,
}: {
	compact?: boolean;
}) {
	return (
		<View style={styles.content} pointerEvents="none">
			<View style={styles.orbitOuter}>
				<View style={styles.orbitMiddle}>
					<View style={styles.orbitInner} />
				</View>
			</View>

			<View style={styles.copy}>
				<Text style={styles.eyebrow}>ROUTE RELAY</Text>
				<Text style={[styles.title, compact ? styles.titleCompact : undefined]}>
					One boundary.{"\n"}Every pair.
				</Text>
				<Text style={styles.caption}>id: stacking-card</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	caption: {
		color: "rgba(255,255,255,0.62)",
		fontFamily: "monospace",
		fontSize: 10,
		marginTop: 8,
	},
	content: {
		flex: 1,
		justifyContent: "flex-end",
		overflow: "hidden",
		padding: 20,
	},
	copy: {
		zIndex: 1,
	},
	eyebrow: {
		color: "#67E8F9",
		fontSize: 11,
		fontWeight: "700",
		letterSpacing: 1.4,
		marginBottom: 8,
	},
	orbitInner: {
		backgroundColor: "#67E8F9",
		borderRadius: 999,
		height: 30,
		width: 30,
	},
	orbitMiddle: {
		alignItems: "center",
		borderColor: "rgba(103,232,249,0.46)",
		borderRadius: 999,
		borderWidth: 1,
		height: 94,
		justifyContent: "center",
		width: 94,
	},
	orbitOuter: {
		alignItems: "center",
		borderColor: "rgba(103,232,249,0.18)",
		borderRadius: 999,
		borderWidth: 1,
		height: 178,
		justifyContent: "center",
		position: "absolute",
		right: -24,
		top: -38,
		width: 178,
	},
	title: {
		color: "white",
		fontSize: 34,
		fontWeight: "700",
		letterSpacing: -1.1,
		lineHeight: 36,
	},
	titleCompact: {
		fontSize: 26,
		lineHeight: 28,
	},
});
