import { ScreenActions } from "@/components/screen-actions";
import { styles } from "@/global.styles";
import Transition from "react-native-screen-transitions";
import { Text, View } from "react-native";

export default function PresetSlideTop() {
	return (
		<Transition.View style={styles.screenCentered}>
			<ScreenActions title="Slide From Top Preset" canGoBack />
			<View style={{ marginTop: 20, alignItems: "center", gap: 8 }}>
				<Text style={styles.screenDesc}>
					📱 This screen slides from the top
				</Text>
				<Text style={[styles.screenDesc, { fontSize: 12 }]}>
					Uses SlideFromTop preset with vertical-inverted gesture
				</Text>
			</View>
		</Transition.View>
	);
}
