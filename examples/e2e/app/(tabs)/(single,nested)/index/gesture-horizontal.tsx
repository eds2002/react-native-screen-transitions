import { ScreenActions } from "@/components/screen-actions";
import { styles } from "@/global.styles";
import Transition from "react-native-screen-transitions";
import { Text, View } from "react-native";

export default function GestureHorizontal() {
	return (
		<Transition.View style={styles.screenCentered}>
			<ScreenActions title="Gesture Horizontal" canGoBack />
			<View style={{ marginTop: 20, alignItems: "center", gap: 8 }}>
				<Text style={styles.screenDesc}>
					🔄 Swipe left or right to dismiss this screen
				</Text>
				<Text style={[styles.screenDesc, { fontSize: 12 }]}>
					This screen has gestureEnabled: true and gestureDirection:
					"horizontal"
				</Text>
			</View>
		</Transition.View>
	);
}
