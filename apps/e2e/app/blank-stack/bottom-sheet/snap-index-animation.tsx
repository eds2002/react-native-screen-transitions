import { Ionicons } from "@expo/vector-icons";
import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
	interpolate,
	interpolateColor,
	useAnimatedStyle,
} from "react-native-reanimated";
import { snapTo, useScreenAnimation } from "react-native-screen-transitions";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAX_SNAP = 1.0;
const MAX_HEIGHT = SCREEN_HEIGHT * MAX_SNAP;

// Snap: [0.25, 0.5, 0.75, 1.0] → indices 0,1,2,3

export default function SnapIndexAnimationScreen() {
	const animation = useScreenAnimation();

	const bgStyle = useAnimatedStyle(() => {
		const { snapIndex } = animation.value;
		const backgroundColor = interpolateColor(
			snapIndex,
			[0, 1, 2, 3],
			["#0D1A2E", "#0D2E1A", "#2E1A0D", "#1A0D2E"],
		);
		return { backgroundColor };
	});

	const tempStyle = useAnimatedStyle(() => {
		const { snapIndex } = animation.value;
		const fontSize = interpolate(snapIndex, [0, 3], [48, 96], "clamp");
		const color = interpolateColor(
			snapIndex,
			[0, 1, 2, 3],
			["#74B9FF", "#00B894", "#FDCB6E", "#E84393"],
		);
		return { fontSize, color };
	});

	const iconScale = useAnimatedStyle(() => {
		const { snapIndex } = animation.value;
		const scale = interpolate(snapIndex, [0, 3], [0.6, 1.4], "clamp");
		const rotate = `${interpolate(snapIndex, [0, 3], [0, 360], "clamp")}deg`;
		return { transform: [{ scale }, { rotate }] };
	});

	const detailsOpacity = useAnimatedStyle(() => {
		const { snapIndex } = animation.value;
		return { opacity: interpolate(snapIndex, [0.8, 1.5], [0, 1], "clamp") };
	});

	const forecastOpacity = useAnimatedStyle(() => {
		const { snapIndex } = animation.value;
		return { opacity: interpolate(snapIndex, [1.5, 2.5], [0, 1], "clamp") };
	});

	const extrasOpacity = useAnimatedStyle(() => {
		const { snapIndex } = animation.value;
		return { opacity: interpolate(snapIndex, [2, 3], [0, 1], "clamp") };
	});

	return (
		<Animated.View
			style={[styles.container, bgStyle, { maxHeight: MAX_HEIGHT }]}
		>
			<View style={styles.handle} />

			{/* Location */}
			<Text style={styles.location}>San Francisco</Text>

			{/* Temperature */}
			<View style={styles.tempRow}>
				<Animated.View style={iconScale}>
					<Ionicons name="partly-sunny" size={44} color="#FDCB6E" />
				</Animated.View>
				<Animated.Text style={[styles.temp, tempStyle]}>68°</Animated.Text>
			</View>
			<Text style={styles.condition}>Partly Cloudy</Text>
			<Text style={styles.hiLo}>H:72° L:54°</Text>

			{/* Details (visible from snap 1+) */}
			<Animated.View style={[styles.detailsGrid, detailsOpacity]}>
				{[
					{ icon: "water" as const, label: "Humidity", value: "62%" },
					{ icon: "speedometer" as const, label: "Wind", value: "12 mph" },
					{ icon: "eye" as const, label: "Visibility", value: "10 mi" },
					{ icon: "thermometer" as const, label: "Feels Like", value: "65°" },
				].map((item) => (
					<View key={item.label} style={styles.detailCard}>
						<Ionicons
							name={item.icon}
							size={20}
							color="rgba(255,255,255,0.5)"
						/>
						<Text style={styles.detailValue}>{item.value}</Text>
						<Text style={styles.detailLabel}>{item.label}</Text>
					</View>
				))}
			</Animated.View>

			{/* Hourly Forecast (visible from snap 2+) */}
			<Animated.View style={[styles.forecastSection, forecastOpacity]}>
				<Text style={styles.sectionTitle}>Hourly</Text>
				<View style={styles.hourlyRow}>
					{[
						{ time: "Now", temp: "68°", icon: "partly-sunny" as const },
						{ time: "2PM", temp: "71°", icon: "sunny" as const },
						{ time: "3PM", temp: "72°", icon: "sunny" as const },
						{ time: "4PM", temp: "70°", icon: "cloudy" as const },
						{ time: "5PM", temp: "66°", icon: "rainy" as const },
					].map((h) => (
						<View key={h.time} style={styles.hourCard}>
							<Text style={styles.hourTime}>{h.time}</Text>
							<Ionicons name={h.icon} size={22} color="#FDCB6E" />
							<Text style={styles.hourTemp}>{h.temp}</Text>
						</View>
					))}
				</View>
			</Animated.View>

			{/* AQI + UV (visible from snap 3) */}
			<Animated.View style={[styles.extrasRow, extrasOpacity]}>
				<View style={[styles.extraCard, { backgroundColor: "#00B89415" }]}>
					<Text style={styles.extraLabel}>Air Quality</Text>
					<Text style={[styles.extraValue, { color: "#00B894" }]}>42 Good</Text>
					<View style={styles.extraBar}>
						<View
							style={[
								styles.extraBarFill,
								{ width: "42%", backgroundColor: "#00B894" },
							]}
						/>
					</View>
				</View>
				<View style={[styles.extraCard, { backgroundColor: "#FDCB6E15" }]}>
					<Text style={styles.extraLabel}>UV Index</Text>
					<Text style={[styles.extraValue, { color: "#FDCB6E" }]}>6 High</Text>
					<View style={styles.extraBar}>
						<View
							style={[
								styles.extraBarFill,
								{ width: "60%", backgroundColor: "#FDCB6E" },
							]}
						/>
					</View>
				</View>
			</Animated.View>

			{/* Snap Buttons */}
			<View style={styles.snapRow}>
				{[
					{ idx: 0, label: "25%" },
					{ idx: 1, label: "50%" },
					{ idx: 2, label: "75%" },
					{ idx: 3, label: "100%" },
				].map(({ idx, label }) => (
					<Pressable
						key={idx}
						testID={`snap-to-${idx}`}
						style={styles.snapBtn}
						onPress={() => snapTo(idx)}
					>
						<Text style={styles.snapBtnText}>{label}</Text>
					</Pressable>
				))}
			</View>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		alignItems: "center",
		paddingHorizontal: 20,
	},
	handle: {
		width: 44,
		height: 5,
		backgroundColor: "rgba(255,255,255,0.2)",
		borderRadius: 3,
		marginTop: 12,
		marginBottom: 16,
	},
	location: {
		fontSize: 18,
		fontWeight: "800",
		color: "rgba(255,255,255,0.6)",
		marginBottom: 8,
	},
	tempRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	temp: {
		fontWeight: "900",
	},
	condition: {
		fontSize: 18,
		fontWeight: "700",
		color: "rgba(255,255,255,0.5)",
		marginTop: 4,
	},
	hiLo: {
		fontSize: 15,
		fontWeight: "700",
		color: "rgba(255,255,255,0.3)",
		marginBottom: 20,
	},
	detailsGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 10,
		width: "100%",
		marginBottom: 20,
	},
	detailCard: {
		width: "47%",
		backgroundColor: "rgba(255,255,255,0.06)",
		borderRadius: 18,
		padding: 16,
		gap: 6,
	},
	detailValue: {
		fontSize: 20,
		fontWeight: "900",
		color: "#fff",
	},
	detailLabel: {
		fontSize: 12,
		fontWeight: "700",
		color: "rgba(255,255,255,0.35)",
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	forecastSection: {
		width: "100%",
		marginBottom: 20,
	},
	sectionTitle: {
		fontSize: 16,
		fontWeight: "800",
		color: "rgba(255,255,255,0.6)",
		marginBottom: 12,
	},
	hourlyRow: {
		flexDirection: "row",
		gap: 8,
	},
	hourCard: {
		flex: 1,
		backgroundColor: "rgba(255,255,255,0.06)",
		borderRadius: 16,
		paddingVertical: 14,
		alignItems: "center",
		gap: 8,
	},
	hourTime: {
		fontSize: 12,
		fontWeight: "700",
		color: "rgba(255,255,255,0.4)",
	},
	hourTemp: {
		fontSize: 16,
		fontWeight: "800",
		color: "#fff",
	},
	extrasRow: {
		flexDirection: "row",
		gap: 10,
		width: "100%",
		marginBottom: 20,
	},
	extraCard: {
		flex: 1,
		borderRadius: 18,
		padding: 16,
		gap: 8,
	},
	extraLabel: {
		fontSize: 12,
		fontWeight: "700",
		color: "rgba(255,255,255,0.4)",
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	extraValue: {
		fontSize: 18,
		fontWeight: "900",
	},
	extraBar: {
		height: 5,
		backgroundColor: "rgba(255,255,255,0.1)",
		borderRadius: 3,
	},
	extraBarFill: {
		position: "absolute",
		left: 0,
		top: 0,
		bottom: 0,
		borderRadius: 3,
	},
	snapRow: {
		flexDirection: "row",
		gap: 8,
		marginTop: 4,
	},
	snapBtn: {
		backgroundColor: "rgba(255,255,255,0.08)",
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 10,
	},
	snapBtnText: {
		fontSize: 13,
		fontWeight: "700",
		color: "rgba(255,255,255,0.5)",
	},
});
