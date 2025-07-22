import { ScreenActions } from "@/components/screen-actions";
import { styles } from "@/global.styles";
import Transition from "react-native-screen-transitions";
import { Text, View, Button, Alert } from "react-native";
import { router } from "expo-router";
import { useState } from "react";

export default function CustomCallback() {
	const [callbackLog, setCallbackLog] = useState<string[]>([]);

	const handleTestCallback = () => {
		setCallbackLog((prev) => [
			...prev,
			`Animation started at ${new Date().toLocaleTimeString()}`,
		]);

		// Navigate and expect callback to fire
		router.push("/custom-callback");

		// Simulate callback (in real implementation, this would come from the animation engine)
		setTimeout(() => {
			setCallbackLog((prev) => [
				...prev,
				`Animation finished at ${new Date().toLocaleTimeString()}`,
			]);
		}, 400); // Match the transition duration
	};

	const clearLog = () => {
		setCallbackLog([]);
	};

	return (
		<Transition.View style={styles.screenCentered}>
			<ScreenActions title="Custom Callback Test" canGoBack />
			<View style={{ marginTop: 20, alignItems: "center", gap: 12 }}>
				<Text style={styles.screenDesc}>
					📝 Test animation completion callbacks
				</Text>
				<Text style={[styles.screenDesc, { fontSize: 12 }]}>
					Monitor when animations start and finish
				</Text>
				<View style={{ flexDirection: "row", gap: 10 }}>
					<Button
						title="Test Callback"
						onPress={handleTestCallback}
						testID="test-callback"
					/>
					<Button title="Clear Log" onPress={clearLog} testID="clear-log" />
				</View>
				<View style={{ marginTop: 10, maxHeight: 100 }}>
					{callbackLog.map((log) => (
						<Text key={log} style={[styles.screenDesc, { fontSize: 10 }]}>
							{log}
						</Text>
					))}
				</View>
			</View>
		</Transition.View>
	);
}
