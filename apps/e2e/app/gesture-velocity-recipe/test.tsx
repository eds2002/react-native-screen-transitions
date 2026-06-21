import { StyleSheet, Text, View } from "react-native";
import Transition from "react-native-screen-transitions";
import {
	VELOCITY_FLAP_FOCAL_STYLE_ID,
	VELOCITY_FLAP_SIZE,
	VELOCITY_FLAP_STYLE_ID,
} from "./constants";

export default function GestureVelocityRecipeTest() {
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
			<Transition.View
				pointerEvents="none"
				styleId={VELOCITY_FLAP_FOCAL_STYLE_ID}
				style={styles.focalPoint}
			>
				<View style={styles.focalDot} />
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
		width: VELOCITY_FLAP_SIZE,
		height: VELOCITY_FLAP_SIZE,
		overflow: "visible",
	},
	box: {
		width: VELOCITY_FLAP_SIZE,
		height: VELOCITY_FLAP_SIZE,
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
	focalPoint: {
		position: "absolute",
		left: 0,
		top: 0,
		width: 36,
		height: 36,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.72)",
		borderRadius: 18,
		backgroundColor: "rgba(255,255,255,0.18)",
		shadowColor: "#FFFFFF",
		shadowOffset: { width: 0, height: 0 },
		shadowOpacity: 0.45,
		shadowRadius: 12,
	},
	focalDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: "#FFFFFF",
	},
	label: {
		color: "#FFFFFF",
		fontSize: 22,
		fontWeight: "800",
	},
});
