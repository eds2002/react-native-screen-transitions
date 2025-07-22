import { ScreenActions } from "@/components/screen-actions";
import { styles } from "@/global.styles";
import Transition from "react-native-screen-transitions";
import { Text, View, Button } from "react-native";
import { router } from "expo-router";
import { useState } from "react";

export default function RapidNavigation() {
	const [clickCount, setClickCount] = useState(0);

	const handleRapidPush = () => {
		setClickCount((prev) => prev + 1);
		// Push to the same screen multiple times rapidly
		router.push("/rapid-navigation");
	};

	const handleRapidBack = () => {
		router.back();
	};

	return (
		<Transition.View style={styles.screenCentered}>
			<ScreenActions title="Rapid Navigation Test" canGoBack />
			<View style={{ marginTop: 20, alignItems: "center", gap: 12 }}>
				<Text style={styles.screenDesc}>⚡ Test rapid push/pop operations</Text>
				<Text style={[styles.screenDesc, { fontSize: 12 }]}>
					Push count: {clickCount}
				</Text>
				<View style={{ flexDirection: "row", gap: 10 }}>
					<Button
						title="Rapid Push"
						onPress={handleRapidPush}
						testID="rapid-push"
					/>
					<Button
						title="Rapid Back"
						onPress={handleRapidBack}
						testID="rapid-back"
					/>
				</View>
			</View>
		</Transition.View>
	);
}
