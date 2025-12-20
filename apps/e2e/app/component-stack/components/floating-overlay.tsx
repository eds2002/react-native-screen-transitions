import { StyleSheet, View } from "react-native";
import { createComponentStackNavigator } from "react-native-screen-transitions/component-stack";
import { ActiveContent } from "./active-content";
import { FloatingBar } from "./floating-bar";
import { floatingInterpolator, transitionSpec } from "./interpolator";

const Stack = createComponentStackNavigator();

/**
 * FloatingOverlay - ComponentStack navigator wrapper
 *
 * This is positioned absolutely over the screen and uses
 * ComponentStack for navigation (independent of Expo Router).
 * The URL does not change when navigating within this overlay.
 */
export function FloatingOverlay() {
	return (
		<View style={styles.overlay} pointerEvents="box-none">
			<Stack.Navigator initialRouteName="idle">
				<Stack.Screen name="idle" component={FloatingBar} />
				<Stack.Screen
					name="expanded"
					component={ActiveContent}
					options={{
						screenStyleInterpolator: floatingInterpolator,
						transitionSpec,
						gestureEnabled: true,
						gestureDirection: "vertical",
					}}
				/>
			</Stack.Navigator>
		</View>
	);
}

const styles = StyleSheet.create({
	overlay: {
		...StyleSheet.absoluteFillObject,
	},
});
