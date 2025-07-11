import { Dimensions, FlatList, StyleSheet, View } from "react-native";
import Transition from "react-native-screen-transitions";

const { height } = Dimensions.get("window");
export default function D() {
	return (
		<Transition.View style={styles.container}>
			<FlatList
				data={Array.from({ length: 5 })}
				renderItem={() => <View style={styles.reel} />}
				contentContainerStyle={styles.contentContainer}
				snapToInterval={height * 0.8 + height * 0.1}
				decelerationRate="fast"
				hitSlop={50}
				bounces={false}
				disableIntervalMomentum
				showsVerticalScrollIndicator={false}
				snapToAlignment="center"
			/>
		</Transition.View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,

		backgroundColor: "lightblue",
		borderRadius: 48,
	},
	reel: {
		width: "90%",
		alignSelf: "center",
		marginHorizontal: 16,
		height: height * 0.8,
		backgroundColor: "white",
		borderRadius: 24,
	},
	contentContainer: {
		paddingTop: height * 0.1,
		gap: height * 0.05,
	},
});
