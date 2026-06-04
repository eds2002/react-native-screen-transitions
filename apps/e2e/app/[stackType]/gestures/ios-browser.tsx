import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ScreenHeader } from "@/components/screen-header";
import {
	buildStackPath,
	useResolvedStackType,
} from "@/components/stack-examples/stack-routing";
import { DemoScreen } from "@/components/ui";
import { useTheme } from "@/theme";

const TABS = ["Inbox", "Docs", "Board"];

export default function IOSBrowserGestureScreen() {
	const theme = useTheme();
	const stackType = useResolvedStackType();

	return (
		<DemoScreen tint="#102A33">
			<ScreenHeader
				title="iOS Browser"
				subtitle="Pinch, rotate, then dismiss"
				light
			/>
			<View style={styles.stage}>
				<View style={[styles.browser, { backgroundColor: theme.bg }]}>
					<View style={styles.chrome}>
						<View style={styles.trafficLights}>
							<View style={[styles.dot, { backgroundColor: "#FF5F57" }]} />
							<View style={[styles.dot, { backgroundColor: "#FFBD2E" }]} />
							<View style={[styles.dot, { backgroundColor: "#28C840" }]} />
						</View>
						<View style={styles.address}>
							<Text style={styles.lock}>secure.site</Text>
						</View>
					</View>

					<View style={styles.tabRow}>
						{TABS.map((tab, index) => (
							<View
								key={tab}
								style={[
									styles.tab,
									index === 0 ? styles.tabActive : styles.tabIdle,
								]}
							>
								<Text
									style={[
										styles.tabText,
										index === 0 ? styles.tabTextActive : styles.tabTextIdle,
									]}
								>
									{tab}
								</Text>
							</View>
						))}
					</View>

					<View style={styles.heroBlock}>
						<Text style={styles.heroTitle}>Project Console</Text>
						<Text style={styles.heroMeta}>Today, 10:42 AM</Text>
					</View>

					<View style={styles.contentGrid}>
						<View style={styles.sidebar}>
							{["Overview", "Reports", "Files", "Settings"].map((item) => (
								<View key={item} style={styles.navItem}>
									<Text style={styles.navText}>{item}</Text>
								</View>
							))}
						</View>
						<View style={styles.mainPanel}>
							<View style={styles.chartHeader} />
							<View style={styles.chart}>
								<View style={[styles.bar, { height: 42 }]} />
								<View style={[styles.bar, { height: 76 }]} />
								<View style={[styles.bar, { height: 58 }]} />
								<View style={[styles.bar, { height: 92 }]} />
							</View>
							<View style={styles.rows}>
								<View style={styles.row} />
								<View style={styles.row} />
								<View style={styles.rowShort} />
							</View>
						</View>
					</View>
				</View>
			</View>

			<View style={styles.actions}>
				<Pressable
					testID="gesture-dismiss-ios-browser"
					style={styles.dismissButton}
					onPress={() =>
						router.dismissTo(buildStackPath(stackType, "gestures"))
					}
				>
					<Text style={styles.dismissText}>Dismiss To Suite</Text>
				</Pressable>
			</View>
		</DemoScreen>
	);
}

const styles = StyleSheet.create({
	stage: {
		flex: 1,
		justifyContent: "center",
		paddingHorizontal: 22,
		paddingBottom: 24,
	},
	browser: {
		aspectRatio: 0.72,
		borderRadius: 28,
		overflow: "hidden",
		shadowColor: "#000000",
		shadowOpacity: 0.28,
		shadowRadius: 28,
		shadowOffset: { width: 0, height: 18 },
		elevation: 18,
	},
	chrome: {
		height: 58,
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		paddingHorizontal: 16,
		backgroundColor: "#E8EEF2",
	},
	trafficLights: {
		flexDirection: "row",
		gap: 7,
	},
	dot: {
		width: 11,
		height: 11,
		borderRadius: 6,
	},
	address: {
		flex: 1,
		height: 32,
		justifyContent: "center",
		alignItems: "center",
		borderRadius: 8,
		backgroundColor: "#FFFFFF",
	},
	lock: {
		fontSize: 12,
		fontWeight: "700",
		color: "#52616B",
	},
	tabRow: {
		flexDirection: "row",
		gap: 8,
		padding: 14,
		backgroundColor: "#F6F8FA",
	},
	tab: {
		flex: 1,
		height: 34,
		justifyContent: "center",
		alignItems: "center",
		borderRadius: 8,
	},
	tabActive: {
		backgroundColor: "#FFFFFF",
	},
	tabIdle: {
		backgroundColor: "#E8EEF2",
	},
	tabText: {
		fontSize: 12,
		fontWeight: "800",
	},
	tabTextActive: {
		color: "#20313B",
	},
	tabTextIdle: {
		color: "#72808A",
	},
	heroBlock: {
		margin: 16,
		padding: 18,
		borderRadius: 18,
		backgroundColor: "#153F4C",
	},
	heroTitle: {
		fontSize: 24,
		fontWeight: "800",
		color: "#FFFFFF",
	},
	heroMeta: {
		marginTop: 6,
		fontSize: 13,
		fontWeight: "700",
		color: "rgba(255,255,255,0.68)",
	},
	contentGrid: {
		flex: 1,
		flexDirection: "row",
		gap: 12,
		paddingHorizontal: 16,
		paddingBottom: 16,
	},
	sidebar: {
		width: 98,
		gap: 8,
	},
	navItem: {
		height: 34,
		justifyContent: "center",
		paddingHorizontal: 10,
		borderRadius: 8,
		backgroundColor: "#EEF3F6",
	},
	navText: {
		fontSize: 11,
		fontWeight: "700",
		color: "#52616B",
	},
	mainPanel: {
		flex: 1,
		borderRadius: 16,
		padding: 14,
		backgroundColor: "#F7FAFC",
	},
	chartHeader: {
		width: "54%",
		height: 14,
		borderRadius: 7,
		backgroundColor: "#D6E2E8",
	},
	chart: {
		height: 116,
		flexDirection: "row",
		alignItems: "flex-end",
		gap: 10,
		marginTop: 18,
	},
	bar: {
		flex: 1,
		borderRadius: 8,
		backgroundColor: "#2F6F7D",
	},
	rows: {
		gap: 8,
		marginTop: 18,
	},
	row: {
		height: 10,
		borderRadius: 5,
		backgroundColor: "#D6E2E8",
	},
	rowShort: {
		width: "68%",
		height: 10,
		borderRadius: 5,
		backgroundColor: "#D6E2E8",
	},
	actions: {
		paddingHorizontal: 22,
		paddingBottom: 18,
	},
	dismissButton: {
		height: 52,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 16,
		backgroundColor: "#FFFFFF",
	},
	dismissText: {
		fontSize: 16,
		fontWeight: "800",
		color: "#102A33",
	},
});
