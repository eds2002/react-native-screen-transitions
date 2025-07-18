import { type ColorValue, Dimensions, StyleSheet, View } from "react-native";
import Transition from "react-native-screen-transitions";

const { height } = Dimensions.get("window");
const colors = ["#ff0000", "#00ff00", "#0000ff", "#ff00ff"];
export function ScreenD() {
	return (
		<Transition.View style={styles.container}>
			<Transition.FlatList
				data={colors}
				renderItem={({ item }) => (
					<View
						style={[styles.reel, { backgroundColor: item as ColorValue }]}
					/>
				)}
			/>
		</Transition.View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "white",
		borderRadius: 48,
		overflow: "hidden",
	},
	reel: {
		alignSelf: "center",
		height: height,
		width: "100%",
		backgroundColor: "lightblue",
	},
});
