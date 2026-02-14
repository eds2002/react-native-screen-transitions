import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import { BOUNDARY_ID, BOUNDARY_NAMESPACE } from "./constants";

export default function BoundsDetail() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const { width } = useWindowDimensions();

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader title="Boundary Detail" subtitle={id ?? "detail"} />
			<View style={styles.content}>
				<Transition.Boundary
					namespace={BOUNDARY_NAMESPACE}
					id={BOUNDARY_ID}
					style={[
						styles.destination,
						{ width: width * 0.85, height: width * 0.85 },
					]}
				>
					<Text style={styles.destinationText}>Shared Boundary</Text>
				</Transition.Boundary>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		// backgroundColor: "#121212",
		opacity: 0.5,
	},
	content: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	destination: {
		borderRadius: 24,
		backgroundColor: "#4f7cff",
		alignItems: "center",
		justifyContent: "center",
	},
	destinationText: {
		color: "#fff",
		fontWeight: "700",
		fontSize: 18,
	},
});
