import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/screen-header";

export default function FromBottomScreen() {
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<View style={styles.content}>
				<View style={styles.handle} />
				<ScreenHeader
					title="From Bottom"
					subtitle="Drag up and down to snap between points. Swipe down to dismiss."
				/>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#1a1a2e",
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16,
	},
	content: {
		flex: 1,
		padding: 20,
		alignItems: "center",
	},
	handle: {
		width: 40,
		height: 4,
		backgroundColor: "rgba(255,255,255,0.3)",
		borderRadius: 2,
		marginBottom: 20,
	},
});
