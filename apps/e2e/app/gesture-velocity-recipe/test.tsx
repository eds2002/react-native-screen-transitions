import { StyleSheet, Text, View } from "react-native";
import Transition from "react-native-screen-transitions";
import { useTheme } from "@/theme";
import { VELOCITY_FLAP_STYLE_ID } from "./constants";

export default function GestureVelocityRecipeTest() {
	const theme = useTheme();

	return (
		<View style={[styles.container]}>
			<Transition.View
				styleId={VELOCITY_FLAP_STYLE_ID}
				testID={VELOCITY_FLAP_STYLE_ID}
				style={styles.flapLayer}
			>
				<View style={styles.box}>
					<Text style={styles.label}>Drag</Text>
				</View>
			</Transition.View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		overflow: "visible",
	},
	flapLayer: {
		width: 160,
		height: 160,
		overflow: "visible",
	},
	box: {
		width: 160,
		height: 160,
		alignItems: "center",
		justifyContent: "center",
		backfaceVisibility: "hidden",
		borderRadius: 24,
		backgroundColor: "#EF4444",
		shadowColor: "#000000",
		shadowOffset: { width: 0, height: 24 },
		shadowOpacity: 0.24,
		shadowRadius: 32,
		elevation: 12,
	},
	label: {
		color: "#FFFFFF",
		fontSize: 22,
		fontWeight: "800",
	},
});
