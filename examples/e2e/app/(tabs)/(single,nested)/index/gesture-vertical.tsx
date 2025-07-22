import { ScreenActions } from "@/components/screen-actions";
import { styles } from "@/global.styles";
import Transition from "react-native-screen-transitions";
import { Text, View } from "react-native";

export default function GestureVertical() {
	return (
		<Transition.View style={styles.screenCentered}>
			<ScreenActions title="Gesture Vertical" canGoBack />
			<View style={{ marginTop: 20, alignItems: "center", gap: 8 }}>
				<Text style={styles.screenDesc}>
					↕️ Swipe up or down to dismiss this screen
				</Text>
				<Text style={[styles.screenDesc, { fontSize: 12 }]}>
					This screen has gestureEnabled: true and gestureDirection: "vertical"
				</Text>
			</View>
		</Transition.View>
	);
}
