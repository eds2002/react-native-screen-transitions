import { StyleSheet, Text, View } from "react-native";
import Transition from "react-native-screen-transitions";
import { BlankStack } from "@/layouts/blank-stack";
import { AnimationProbe } from "./animation-probe";
import {
	observerChildInterpolator,
	observerIndexInterpolator,
} from "./interpolators";

function OuterLayoutObserver() {
	return (
		<View pointerEvents="none" style={styles.observer}>
			<Text style={styles.eyebrow}>OUTER LAYOUT · TRANSITION KEYS</Text>
			<AnimationProbe
				color="#38BDF8"
				label="observer-root"
				testID="observer-layout-current"
			/>
			<AnimationProbe
				color="#F472B6"
				label="observer-index"
				testID="observer-layout-child"
			/>
			<AnimationProbe
				color="#A78BFA"
				label="observer-child"
				testID="observer-layout-grandchild"
			/>
		</View>
	);
}

export default function ObserverLayout() {
	return (
		<View style={styles.container}>
			<BlankStack>
				<BlankStack.Screen
					name="index"
					options={{
						screenStyleInterpolator: observerIndexInterpolator,
						transitionKey: "observer-index",
						transitionSpec: {
							open: Transition.Specs.DefaultSpec,
							close: Transition.Specs.DefaultSpec,
						},
					}}
				/>
				<BlankStack.Screen
					name="child"
					options={{
						transitionKey: "observer-child",
						gestureEnabled: true,
						gestureDirection: "horizontal",
						screenStyleInterpolator: observerChildInterpolator,
						transitionSpec: {
							open: Transition.Specs.DefaultSpec,
							close: Transition.Specs.DefaultSpec,
						},
					}}
				/>
			</BlankStack>
			<OuterLayoutObserver />
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	eyebrow: {
		color: "#94A3B8",
		fontSize: 10,
		fontWeight: "800",
		letterSpacing: 1.1,
	},
	observer: {
		backgroundColor: "rgba(15,23,42,0.96)",
		borderColor: "rgba(148,163,184,0.28)",
		borderRadius: 18,
		borderWidth: 1,
		gap: 10,
		left: 14,
		padding: 14,
		position: "absolute",
		right: 14,
		top: 54,
		zIndex: 100,
	},
});
