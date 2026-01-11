import { StyleSheet, View } from "react-native";
import { FloatingOverlay } from "@/components/component-stack/floating-overlay";
import { ScreenHeader } from "@/components/screen-header";

export default function SizeTransitionsDemo() {
	return (
		<View style={styles.container}>
			<ScreenHeader
				title="Size Transitions"
				subtitle="Tap size buttons below. Uses shared bounds to animate position and size."
			/>
			<FloatingOverlay />
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#121212",
	},
});
