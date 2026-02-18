import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";

const ITEMS = Array.from({ length: 16 }, (_, i) => ({
	id: `spam-${i}`,
	label: `${i + 1}`,
	color: `hsl(${i * 22.5}, 80%, 55%)`,
}));

export default function BoundsSpamDetail() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const { width } = useWindowDimensions();
	const item = ITEMS.find((i) => i.id === id);
	const size = width * 0.85;

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader title="Spam Detail" subtitle={id} />
			<View style={styles.content}>
				<Transition.Boundary
					id={id}
					style={[
						styles.destination,
						{
							width: size,
							height: size,
							backgroundColor: item?.color ?? "#333",
						},
					]}
				>
					<Text style={styles.label}>{item?.label ?? "?"}</Text>
				</Transition.Boundary>
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
		borderRadius: 24,
		alignItems: "center",
		justifyContent: "center",
	},
	label: {
		color: "#fff",
		fontWeight: "700",
		fontSize: 64,
	},
});
