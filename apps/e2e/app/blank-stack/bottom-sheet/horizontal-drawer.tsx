import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/screen-header";

export default function HorizontalDrawerScreen() {
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<View style={styles.content}>
				<View style={styles.handle} />
				<ScreenHeader
					title="Horizontal Drawer"
					subtitle="Slides from the right edge. Drag left/right to snap between 50% and 100% width."
				/>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#2d1b4e",
		borderTopLeftRadius: 16,
		borderBottomLeftRadius: 16,
	},
	content: {
		flex: 1,
		padding: 20,
		alignItems: "center",
		justifyContent: "center",
	},
	handle: {
		width: 4,
		height: 40,
		backgroundColor: "rgba(255,255,255,0.3)",
		borderRadius: 2,
		position: "absolute",
		left: 8,
		top: "50%",
		marginTop: -20,
	},
});
