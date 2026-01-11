import MaskedView from "@react-native-masked-view/masked-view";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Transition from "react-native-screen-transitions";

import { ScreenHeader } from "@/components/screen-header";

export default function WithResistanceScreen() {
	return (
		<MaskedView
			style={StyleSheet.absoluteFill}
			maskElement={
				<Transition.View
					styleId="MASKED"
					style={{ flex: 1 }}
					pointerEvents="none"
				/>
			}
			pointerEvents="box-none"
		>
			{/* Content positioned at bottom, mask reveals it from bottom up */}
			<Transition.View styleId="CONTENT" style={styles.container}>
				<View style={styles.handle} />
				<ScreenHeader
					title="With Resistance"
					subtitle="Apple Maps style sheet. Drag between snap points - compact pill, half sheet, or full screen."
				/>

				<Pressable
					style={[styles.button, styles.secondaryButton]}
					onPress={() => router.push("/blank-stack/bottom-sheet/normal")}
				>
					<Text style={styles.buttonText}>Push Normal Stack</Text>
				</Pressable>
			</Transition.View>
		</MaskedView>
	);
}

const styles = StyleSheet.create({
	container: {
		position: "absolute",
		left: 0,
		right: 0,
		bottom: 0,
		height: "100%",
		backgroundColor: "#1a2e1a",
		padding: 20,
		paddingTop: 12,
		alignItems: "center",
	},
	handle: {
		width: 40,
		height: 4,
		backgroundColor: "rgba(255,255,255,0.3)",
		borderRadius: 2,
		marginBottom: 20,
	},
	button: {
		backgroundColor: "rgba(255,255,255,0.2)",
		paddingVertical: 16,
		paddingHorizontal: 32,
		borderRadius: 12,
		minWidth: 200,
		alignItems: "center",
	},
	buttonText: {
		fontSize: 16,
		fontWeight: "600",
		color: "#fff",
	},
	secondaryButton: {
		marginTop: 12,
		backgroundColor: "transparent",
		borderWidth: 1,
		borderColor: "rgba(255,255,255,0.3)",
	},
});
