import { ScreenActions } from "@/components/screen-actions";
import { styles } from "@/global.styles";
import Transition from "react-native-screen-transitions";
import { Text, View } from "react-native";

export default function PresetElasticCard() {
	return (
		<Transition.View style={styles.screenCentered}>
			<ScreenActions title="Elastic Card Preset" canGoBack />
			<View style={{ marginTop: 20, alignItems: "center", gap: 8 }}>
				<Text style={styles.screenDesc}>
					🎯 Drag anywhere to see elastic effect
				</Text>
				<Text style={[styles.screenDesc, { fontSize: 12 }]}>
					Uses ElasticCard preset with bidirectional gestures and elastic
					scaling
				</Text>
			</View>
		</Transition.View>
	);
}
