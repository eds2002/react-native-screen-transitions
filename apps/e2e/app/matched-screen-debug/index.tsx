import { router } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import Transition from "react-native-screen-transitions";

const BOUNDARY_ID = "video-nested";

export default function MatchedScreenDebugIndex() {
	return (
		<Pressable
			testID="matched-screen-debug-a"
			style={styles.screen}
			onPress={() => router.push("/matched-screen-debug/player")}
		>
			<View style={styles.aPlacement}>
				<Transition.Boundary
					id={BOUNDARY_ID}
					testID="matched-screen-debug-a-boundary"
					portal="matched-screen"
					style={styles.box}
				/>
			</View>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		backgroundColor: "white",
	},
	box: {
		width: 96,
		height: 96,
		minWidth: 96,
		minHeight: 96,
		maxWidth: 96,
		maxHeight: 96,
		aspectRatio: 1 / 1,
		backgroundColor: "#8A8A8A",
	},
	aPlacement: {
		marginLeft: 64,
		marginTop: 160,
		width: 96,
		height: 96,
	},
});
