import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActionButton } from "../components/action-button";

export default function DetailScreen() {
	const router = useRouter();

	return (
		<SafeAreaView style={styles.screen}>
			<View style={styles.artwork}>
				<View style={styles.orbit} />
				<View style={styles.planet} />
			</View>
			<View>
				<Text style={styles.eyebrow}>DETAIL TRANSITION</Text>
				<Text style={styles.title}>Drag down to dismiss.</Text>
				<Text style={styles.description}>
					This screen uses the v3 SlideFromBottom preset. Replace it with your
					own interpolator when the product needs a distinct motion language.
				</Text>
			</View>
			<ActionButton label="Go back" onPress={router.back} secondary />
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	artwork: {
		alignItems: "center",
		alignSelf: "center",
		backgroundColor: "#2A2040",
		borderRadius: 72,
		height: 144,
		justifyContent: "center",
		marginTop: 32,
		width: 144,
	},
	description: {
		color: "#CBC2D8",
		fontSize: 17,
		lineHeight: 25,
		marginTop: 16,
	},
	eyebrow: {
		color: "#C4B5FD",
		fontSize: 12,
		fontWeight: "800",
		letterSpacing: 1.1,
	},
	orbit: {
		borderColor: "#C4B5FD",
		borderRadius: 60,
		borderWidth: 2,
		height: 68,
		position: "absolute",
		transform: [{ rotate: "-24deg" }],
		width: 116,
	},
	planet: {
		backgroundColor: "#FDBA74",
		borderRadius: 22,
		height: 44,
		width: 44,
	},
	screen: {
		backgroundColor: "#20182C",
		flex: 1,
		justifyContent: "space-between",
		padding: 24,
	},
	title: {
		color: "#F4F1FF",
		fontSize: 40,
		fontWeight: "800",
		letterSpacing: -1.3,
		lineHeight: 44,
		marginTop: 12,
	},
});
