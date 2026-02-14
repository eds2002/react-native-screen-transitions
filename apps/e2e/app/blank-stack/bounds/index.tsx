import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { runOnUI } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import { activeBoundaryId, BOUNDARY_GROUP, ITEMS } from "./constants";

export default function BoundsIndex() {
	const handlePress = (id: string) => {
		runOnUI(() => {
			"worklet";
			activeBoundaryId.value = id;
		})();
		router.push(`/blank-stack/bounds/${id}` as `/blank-stack/bounds/${string}`);
	};

	return (
		<SafeAreaView style={styles.container} edges={[]}>
			<ScreenHeader
				title="Boundary (v2)"
				subtitle="Dynamic retargeting · group continuity"
			/>
			<View style={styles.content}>
				<View style={styles.row}>
					{ITEMS.map((item) => (
						<Pressable
							key={item.id}
							testID={`bounds-open-${item.id}`}
							onPress={() => handlePress(item.id)}
						>
							<Transition.Boundary
								group={BOUNDARY_GROUP}
								id={item.id}
								style={[styles.source, { backgroundColor: item.color }]}
							>
								<Text style={styles.sourceText}>{item.label}</Text>
							</Transition.Boundary>
						</Pressable>
					))}
				</View>
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
	row: {
		flexDirection: "row",
		gap: 24,
	},
	source: {
		width: 120,
		height: 120,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
	},
	sourceText: {
		color: "#fff",
		fontWeight: "700",
		fontSize: 24,
	},
});
