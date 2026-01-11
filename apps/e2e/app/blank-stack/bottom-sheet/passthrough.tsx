import { StyleSheet, View } from "react-native";

import { ScreenHeader } from "@/components/screen-header";

export default function PassthroughScreen() {
	return (
		<View style={styles.container}>
			<View style={styles.sheet}>
				<View style={styles.handle} />
				<ScreenHeader
					title="Passthrough"
					subtitle="Content behind this sheet is still interactive. Try scrolling or tapping the list behind."
				/>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "flex-end",
	},
	sheet: {
		backgroundColor: "#3d2645",
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		padding: 20,
		paddingTop: 12,
		alignItems: "center",
		minHeight: 250,
	},
	handle: {
		width: 40,
		height: 4,
		backgroundColor: "rgba(255,255,255,0.3)",
		borderRadius: 2,
		marginBottom: 20,
	},
});
