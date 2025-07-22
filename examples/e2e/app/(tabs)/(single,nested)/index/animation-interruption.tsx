import { ScreenActions } from "@/components/screen-actions";
import { styles } from "@/global.styles";
import Transition from "react-native-screen-transitions";
import { Text, View, Button } from "react-native";
import { router } from "expo-router";

export default function AnimationInterruption() {
	const handleInterruptAndPush = () => {
		// Push immediately, interrupting any ongoing animation
		router.push("/animation-interruption");
	};

	const handleInterruptAndBack = () => {
		// Go back immediately, interrupting any ongoing animation
		router.back();
	};

	return (
		<Transition.View style={styles.screenCentered}>
			<ScreenActions title="Animation Interruption" canGoBack />
			<View style={{ marginTop: 20, alignItems: "center", gap: 12 }}>
				<Text style={styles.screenDesc}>
					⚡ Test interrupting animations mid-transition
				</Text>
				<Text style={[styles.screenDesc, { fontSize: 12 }]}>
					Navigate while animations are still running
				</Text>
				<View style={{ flexDirection: "row", gap: 10 }}>
					<Button
						title="Push & Interrupt"
						onPress={handleInterruptAndPush}
						testID="interrupt-push"
					/>
					<Button
						title="Back & Interrupt"
						onPress={handleInterruptAndBack}
						testID="interrupt-back"
					/>
				</View>
			</View>
		</Transition.View>
	);
}
