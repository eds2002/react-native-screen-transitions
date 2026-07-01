import { router } from "expo-router";
import { Pressable, StyleSheet } from "react-native";
import Transition from "react-native-screen-transitions";

const BOUNDARY_ID = "video-nested";

export default function MatchedScreenDebugFinal() {
	return (
		<Pressable
			testID="matched-screen-debug-c"
			style={styles.screen}
			onPress={() => router.back()}
		>
			<Transition.Boundary
				id={BOUNDARY_ID}
				testID="matched-screen-debug-c-boundary"
				style={styles.box}
			/>
		</Pressable>
	);
}

const styles = StyleSheet.create({
	screen: {
		flex: 1,
		justifyContent: "flex-end",
		alignItems: "flex-end",
		backgroundColor: "blue",
	},
	box: {
		width: 96,
		height: 96,
		borderWidth: 3,
		borderColor: "red",
	},
});
