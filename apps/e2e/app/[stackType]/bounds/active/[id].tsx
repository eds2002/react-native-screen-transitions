import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

export default function ActiveBoundsDetail() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const { width } = useWindowDimensions();
	const theme = useTheme();

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]} edges={["top"]}>
			<ScreenHeader title="Detail" subtitle={id} />
			<View style={styles.content}>
				<Transition.Boundary.View
					id={id}
					style={[
						styles.destination,
						{ width: width * 0.9, height: width * 0.9, backgroundColor: theme.card },
					]}
				>
					<Text style={[styles.destinationText, { color: theme.text }]}>
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
	},
	content: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	destination: {
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
	},
	destinationText: {
		fontSize: 16,
		fontWeight: "500",
		textAlign: "center",
	},
});
