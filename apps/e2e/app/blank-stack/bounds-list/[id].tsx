import { useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";

const ITEMS = Array.from({ length: 30 }, (_, i) => ({
	id: `list-${i}`,
	label: `Item ${i + 1}`,
	color: `hsl(${i * 12}, 70%, 50%)`,
}));

export default function BoundsListDetail() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const { width } = useWindowDimensions();
	const item = ITEMS.find((i) => i.id === id);
	const size = width * 0.7;

	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader title="List Detail" subtitle={item?.label ?? id} />
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
					<Text style={styles.label}>{item?.label.split(" ")[1] ?? "?"}</Text>
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
		borderRadius: 999,
		alignItems: "center",
		justifyContent: "center",
	},
	label: {
		color: "#fff",
		fontWeight: "700",
		fontSize: 48,
	},
});
