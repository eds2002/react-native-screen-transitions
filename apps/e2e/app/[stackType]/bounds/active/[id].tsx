import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";

export default function ActiveBoundsDetail() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const { width } = useWindowDimensions();

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader title="Detail" subtitle={id} />
			<View style={styles.content}>
				<Transition.Boundary.View
					id={id}
					style={[
						styles.destination,
						{ width: width * 0.9, height: width * 0.9 },
					]}
				>
					<Text style={styles.destinationText}>
						{`Transition.Boundary id\n"${id}"`}
					</Text>
				</Transition.Boundary.View>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#121212",
	},
	content: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	destination: {
		backgroundColor: "#2a2a2a",
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
		borderColor: "#444",
	},
	destinationText: {
		fontSize: 16,
		fontWeight: "500",
		color: "#fff",
		textAlign: "center",
	},
});
