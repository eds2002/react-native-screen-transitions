import { ScreenActions } from "@/components/screen-actions";
import { styles } from "@/global.styles";
import Transition from "react-native-screen-transitions";
import { Text, View } from "react-native";

export default function PresetZoomIn() {
	return (
		<Transition.View style={styles.screenCentered}>
			<ScreenActions title="Zoom In Preset" canGoBack />
			<View style={{ marginTop: 20, alignItems: "center", gap: 8 }}>
				<Text style={styles.screenDesc}>🔍 This screen zooms in and out</Text>
				<Text style={[styles.screenDesc, { fontSize: 12 }]}>
					Uses ZoomIn preset with scale and opacity animations
				</Text>
			</View>
		</Transition.View>
	);
}
