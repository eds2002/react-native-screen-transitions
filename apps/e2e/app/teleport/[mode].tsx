import { useLocalSearchParams } from "expo-router";
import { ScrollView, ScrollViewBase, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import {
	TELEPORT_GHOST_ID,
	TELEPORT_PAIRED_ID,
	type TeleportMode,
} from "./constants";

function getMode(value: string | string[] | undefined): TeleportMode {
	const mode = Array.isArray(value) ? value[0] : value;
	return mode === "paired" ? "paired" : "ghost";
}

export default function TeleportDestination() {
	const { mode } = useLocalSearchParams<{ mode?: string | string[] }>();
	const teleportMode = getMode(mode);

	return (
		<Transition.ScrollView
			style={[styles.container, { height: 1000 }]}
			contentContainerStyle={{ minHeight: 1000 }}
			showsVerticalScrollIndicator
		>
			<View style={styles.content}>
				{teleportMode === "paired" ? (
					<Transition.Boundary.View
						id={TELEPORT_PAIRED_ID}
						testID="teleport-paired-destination"
						style={styles.orangeCircle}
					/>
				) : (
					<Transition.Boundary.View
						id={TELEPORT_GHOST_ID}
						testID="teleport-ghost-destination"
						style={styles.ghostTarget}
					/>
				)}
			</View>
		</Transition.ScrollView>
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
	orangeCircle: {
		width: 300,
		height: 300,
		borderRadius: 150,
		backgroundColor: "#F97316",
	},
	ghostTarget: {
		width: 300,
		height: 300,
		opacity: 0,
	},
});
