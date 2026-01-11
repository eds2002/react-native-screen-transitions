import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/screen-header";

export default function FromTopScreen() {
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<View style={styles.content}>
				<ScreenHeader
					title="From Top"
					subtitle="Drag up and down to snap between points. Swipe up to dismiss."
				/>

				<View style={styles.handle} />
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#2e1a1a",
		borderBottomLeftRadius: 16,
		borderBottomRightRadius: 16,
	},
	content: {
		flex: 1,
		padding: 20,
		alignItems: "center",
		justifyContent: "flex-end",
	},
	handle: {
		width: 40,
		height: 4,
		backgroundColor: "rgba(255,255,255,0.3)",
		borderRadius: 2,
		marginTop: 20,
	},
});
