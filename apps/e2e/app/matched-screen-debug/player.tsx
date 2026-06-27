import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";

export default function MatchedScreenDebugPlayer() {
	const insets = useSafeAreaInsets();

	return (
		<View style={styles.screen}>
			<Transition.Boundary.View
				id="video"
				testID="matched-screen-debug-destination"
				style={[styles.destinationVideo, { marginTop: insets.top }]}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		backgroundColor: "red",
		borderCurve: "continuous",
	},
	destinationVideo: {
		width: "100%",
		aspectRatio: 16 / 9,
		borderWidth: 1,
		borderColor: "green",
	},
});
