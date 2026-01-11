import { StyleSheet, View } from "react-native";

import { ScreenHeader } from "@/components/screen-header";

export default function BackdropDismissScreen() {
	return (
		<View style={styles.container}>
			<View style={styles.sheet}>
				<View style={styles.handle} />
				<ScreenHeader
					title="Backdrop Dismiss"
					subtitle="Tap anywhere outside this sheet to dismiss. The backdrop area is tappable."
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
		backgroundColor: "#1e3a5f",
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		padding: 20,
		paddingTop: 12,
		alignItems: "center",
		minHeight: 300,
	},
	handle: {
		width: 40,
		height: 4,
		backgroundColor: "rgba(255,255,255,0.3)",
		borderRadius: 2,
		marginBottom: 20,
	},
});
