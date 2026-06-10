import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Transition from "react-native-screen-transitions";
import { useTheme } from "@/theme";
import { TELEPORT_GHOST_ID, TELEPORT_PAIRED_ID } from "./constants";

export default function TeleportIndex() {
	const theme = useTheme();

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
			<View style={styles.stack}>
				<View
					style={{
						width: 400,
						height: 100,
						backgroundColor: "green",
						zIndex: 999,
						position: "absolute",
					}}
				/>
				<Transition.Boundary.Trigger
					id={TELEPORT_PAIRED_ID}
					testID="teleport-paired-trigger"
					portal={{ host: "current-screen" }}
					onPress={() => router.push("/teleport/paired")}
				>
					<Transition.Boundary.Target
						style={[styles.sourceBox, styles.redBox]}
					/>
				</Transition.Boundary.Trigger>

				<Transition.Boundary.Trigger
					id={TELEPORT_GHOST_ID}
					testID="teleport-ghost-trigger"
					portal={{ host: "paired-screen" }}
					onPress={() => router.push("/teleport/ghost")}
				>
					<Transition.Boundary.Target
						style={[styles.sourceBox, styles.blueBox]}
					/>
				</Transition.Boundary.Trigger>
			</View>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	stack: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		gap: 28,
	},
	sourceBox: {
		width: 200,
		height: 200,
	},
	redBox: {
		backgroundColor: "#EF4444",
	},
	blueBox: {
		backgroundColor: "#2563EB",
	},
});
