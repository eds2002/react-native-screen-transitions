import { StyleSheet, View } from "react-native";
import { FloatingOverlay } from "@/components/component-stack/floating-overlay";
import { ScreenHeader } from "@/components/screen-header";
import { useTheme } from "@/theme";

export default function SizeTransitionsDemo() {
	const theme = useTheme();

	return (
		<View style={[styles.container, { backgroundColor: theme.bg }]}>
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
	},
});
