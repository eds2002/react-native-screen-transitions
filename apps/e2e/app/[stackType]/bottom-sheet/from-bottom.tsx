import { Ionicons } from "@expo/vector-icons";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAX_SNAP = 1.0;
const MAX_HEIGHT = SCREEN_HEIGHT * MAX_SNAP;

export default function FromBottomScreen() {
	const insets = useSafeAreaInsets();

	return (
		<View style={[styles.container, { maxHeight: MAX_HEIGHT }]}>
			<View style={[styles.inner, { paddingTop: insets.top + 12 }]}>
				<View style={styles.handle} />

				<Text style={styles.title}>Checkout</Text>
				<Text style={styles.subtitle}>Review your order</Text>

				{/* Order Items */}
				<View style={styles.card}>
					<View style={styles.itemRow}>
						<View style={styles.itemIcon}>
							<Ionicons name="headset" size={24} color="#fff" />
						</View>
						<View style={styles.itemInfo}>
							<Text style={styles.itemName}>AirPods Max</Text>
							<Text style={styles.itemVariant}>Space Black</Text>
						</View>
						<Text style={styles.itemPrice}>$549</Text>
					</View>
					<View style={styles.divider} />
					<View style={styles.itemRow}>
						<View style={[styles.itemIcon, { backgroundColor: "#6C5CE7" }]}>
							<Ionicons name="watch" size={24} color="#fff" />
						</View>
						<View style={styles.itemInfo}>
							<Text style={styles.itemName}>Apple Watch Ultra</Text>
							<Text style={styles.itemVariant}>49mm Titanium</Text>
						</View>
						<Text style={styles.itemPrice}>$799</Text>
					</View>
					<View style={styles.divider} />
					<View style={styles.itemRow}>
						<View style={[styles.itemIcon, { backgroundColor: "#00B894" }]}>
							<Ionicons name="phone-portrait" size={24} color="#fff" />
						</View>
						<View style={styles.itemInfo}>
							<Text style={styles.itemName}>iPhone 16 Pro</Text>
							<Text style={styles.itemVariant}>256GB · Desert Ti</Text>
						</View>
						<Text style={styles.itemPrice}>$1,199</Text>
					</View>
				</View>

				{/* Summary */}
				<View style={styles.card}>
					<View style={styles.summaryRow}>
						<Text style={styles.summaryLabel}>Subtotal</Text>
						<Text style={styles.summaryValue}>$2,547.00</Text>
					</View>
					<View style={styles.summaryRow}>
						<Text style={styles.summaryLabel}>Shipping</Text>
						<Text style={[styles.summaryValue, { color: "#00B894" }]}>
							Free
						</Text>
					</View>
					<View style={styles.summaryRow}>
						<Text style={styles.summaryLabel}>Tax</Text>
						<Text style={styles.summaryValue}>$228.42</Text>
					</View>
					<View style={[styles.divider, { marginVertical: 16 }]} />
					<View style={[styles.summaryRow, { marginBottom: 0 }]}>
						<Text style={styles.totalLabel}>Total</Text>
						<Text style={styles.totalValue}>$2,775.42</Text>
					</View>
				</View>

				{/* Payment Method */}
				<View style={styles.paymentCard}>
					<Ionicons name="card" size={22} color="#fff" />
					<Text style={styles.paymentText}>•••• 4289</Text>
					<View style={{ flex: 1 }} />
					<Text style={styles.paymentChange}>Change</Text>
				</View>

				{/* Pay Button */}
				<View style={styles.payButton}>
					<Ionicons name="lock-closed" size={18} color="#fff" />
					<Text style={styles.payButtonText}>Pay $2,775.42</Text>
				</View>

				<Text style={styles.secureText}>Secured by end-to-end encryption</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#0D0D1A",
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
	},
	inner: {
		flex: 1,
		paddingHorizontal: 20,
		alignItems: "center",
	},
	handle: {
		width: 44,
		height: 5,
		backgroundColor: "rgba(255,255,255,0.2)",
		borderRadius: 3,
		marginBottom: 24,
	},
	title: {
		fontSize: 32,
		fontWeight: "900",
		color: "#fff",
		marginBottom: 4,
	},
	subtitle: {
		fontSize: 16,
		fontWeight: "600",
		color: "rgba(255,255,255,0.4)",
		marginBottom: 28,
	},
	card: {
		backgroundColor: "rgba(255,255,255,0.06)",
		borderRadius: 20,
		padding: 20,
		width: "100%",
		marginBottom: 16,
	},
	itemRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
	},
	itemIcon: {
		width: 48,
		height: 48,
		borderRadius: 16,
		backgroundColor: "#E84393",
		justifyContent: "center",
		alignItems: "center",
	},
	itemInfo: {
		flex: 1,
	},
	itemName: {
		fontSize: 16,
		fontWeight: "800",
		color: "#fff",
	},
	itemVariant: {
		fontSize: 13,
		fontWeight: "600",
		color: "rgba(255,255,255,0.4)",
		marginTop: 2,
	},
	itemPrice: {
		fontSize: 17,
		fontWeight: "800",
		color: "#fff",
	},
	divider: {
		height: 1,
		backgroundColor: "rgba(255,255,255,0.06)",
		marginVertical: 14,
	},
	summaryRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: 10,
	},
	summaryLabel: {
		fontSize: 15,
		fontWeight: "600",
		color: "rgba(255,255,255,0.45)",
	},
	summaryValue: {
		fontSize: 15,
		fontWeight: "700",
		color: "rgba(255,255,255,0.8)",
	},
	totalLabel: {
		fontSize: 18,
		fontWeight: "900",
		color: "#fff",
	},
	totalValue: {
		fontSize: 22,
		fontWeight: "900",
		color: "#fff",
	},
	paymentCard: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "rgba(255,255,255,0.06)",
		borderRadius: 16,
		padding: 16,
		width: "100%",
		marginBottom: 20,
		gap: 12,
	},
	paymentText: {
		fontSize: 16,
		fontWeight: "700",
		color: "#fff",
	},
	paymentChange: {
		fontSize: 14,
		fontWeight: "700",
		color: "#6C5CE7",
	},
	payButton: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "#6C5CE7",
		borderRadius: 20,
		paddingVertical: 18,
		width: "100%",
		gap: 10,
		marginBottom: 14,
	},
	payButtonText: {
		fontSize: 18,
		fontWeight: "900",
		color: "#fff",
	},
	secureText: {
		fontSize: 12,
		fontWeight: "600",
		color: "rgba(255,255,255,0.25)",
	},
});
