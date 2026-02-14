import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { ScreenHeader } from "@/components/screen-header";
import { BOUNDARY_ID, BOUNDARY_NAMESPACE } from "./constants";

export default function BoundsIndex() {
	return (
		<SafeAreaView style={styles.container} edges={["top"]}>
			<ScreenHeader
				title="Boundary (v2)"
				subtitle="One boundary on source screen"
			/>
			<View style={styles.content}>
				<Pressable
					testID="bounds-open"
					onPress={() =>
						router.push(
							"/blank-stack/bounds/detail" as `/blank-stack/bounds/${string}`,
						)
					}
				>
					<Transition.Boundary
						namespace={BOUNDARY_NAMESPACE}
						id={BOUNDARY_ID}
						style={styles.source}
					>
						<Text style={styles.sourceText}>Open Detail</Text>
					</Transition.Boundary>
				</Pressable>
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
	source: {
		width: 120,
		height: 120,
		borderRadius: 16,
		backgroundColor: "#4f7cff",
		alignItems: "center",
		justifyContent: "center",
	},
	sourceText: {
		color: "#fff",
		fontWeight: "700",
	},
});
