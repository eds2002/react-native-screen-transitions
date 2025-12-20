import { usePathname } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import Transition from "react-native-screen-transitions";
import type { ComponentStackScreenProps } from "react-native-screen-transitions/component-stack";
import { BoundsIndicator } from "./bounds-indicator";

type Props = ComponentStackScreenProps<{
	idle: undefined;
	expanded: undefined;
}>;

/**
 * FloatingBar - IDLE state component
 *
 * A small floating bar at the bottom with a sharedBoundTag.
 * When pressed, navigates to expanded view and bounds API
 * animates the transition.
 */
export function FloatingBar({ navigation }: Props) {
	return (
		<BoundsIndicator>
			<View style={styles.container}>
				{/* The floating element that will be shared/morphed */}
				<Transition.Pressable
					sharedBoundTag="FLOATING_ELEMENT"
					style={[styles.floatingBar]}
					onPress={() => navigation.push("expanded")}
				>
					<View style={styles.handle} />
					<Text style={styles.title}>Tap to expand</Text>
					<Text style={styles.subtitle}>
						This floating bar will morph into fullscreen
					</Text>
				</Transition.Pressable>
			</View>
		</BoundsIndicator>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "flex-end",
		padding: 16,
		paddingBottom: 32,
	},
	spacer: {
		flex: 1,
	},
	floatingBar: {
		backgroundColor: "#1e1e1e",
		borderRadius: 24,
		padding: 20,
		alignItems: "center",
		borderWidth: 1,
		borderColor: "#333",
	},
	handle: {
		width: 40,
		height: 4,
		backgroundColor: "#555",
		borderRadius: 2,
		marginBottom: 16,
	},
	title: {
		fontSize: 18,
		fontWeight: "600",
		color: "#fff",
		marginBottom: 4,
	},
	subtitle: {
		fontSize: 14,
		color: "#888",
	},
});
