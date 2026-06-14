import { useLocalSearchParams } from "expo-router";
import {
	Alert,
	Pressable,
	StyleSheet,
	useWindowDimensions,
} from "react-native";
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
	const { height } = useWindowDimensions();
	const teleportMode = getMode(mode);
	const minContentHeight = Math.max(height * 1.35, 900);

	return (
		<Transition.ScrollView
			style={styles.container}
			contentContainerStyle={[styles.content, { minHeight: minContentHeight }]}
			showsVerticalScrollIndicator
		>
			<Transition.Boundary.Host />
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
		</Transition.ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
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
		alignItems: "center",
		justifyContent: "center",
		opacity: 0,
	},
	sourceLabel: {
		color: "white",
		fontSize: 22,
		fontWeight: "700",
		textAlign: "center",
	},
});
