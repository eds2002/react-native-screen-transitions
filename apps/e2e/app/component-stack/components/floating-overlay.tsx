import { StyleSheet, View } from "react-native";
import { interpolate } from "react-native-reanimated";
import type { ScreenInterpolationProps } from "react-native-screen-transitions";
import { createComponentStackNavigator } from "react-native-screen-transitions/component-stack";
import { transitionSpec } from "./interpolator";
import {
	ScreenCompact,
	ScreenFullscreen,
	ScreenLarge,
	ScreenMedium,
	ScreenNested,
	type ScreenParamList,
} from "./screens";

const Stack = createComponentStackNavigator<ScreenParamList>();

/**
 * Shared screen interpolator for bounds-based transitions.
 * Animates the BOUNDS_INDICATOR to follow the FLOATING_ELEMENT position/size.
 */
const boundsInterpolator = (props: ScreenInterpolationProps) => {
	"worklet";

	const { bounds } = props;

	return {
		BOUNDS_INDICATOR: {
			height: bounds.interpolateBounds("FLOATING_ELEMENT", "height", 0),
			width: bounds.interpolateBounds("FLOATING_ELEMENT", "width", 0),
			transform: [
				{
					translateX: bounds.interpolateBounds("FLOATING_ELEMENT", "pageX", 0),
				},
				{
					translateY: bounds.interpolateBounds("FLOATING_ELEMENT", "pageY", 0),
				},
			],
			opacity: interpolate(props.progress, [0, 1, 2], [0, 1, 0]),
		},
	};
};

const screenOptions = {
	screenStyleInterpolator: boundsInterpolator,
	transitionSpec,
	gestureEnabled: true,
	gestureDirection: "vertical" as const,
};

/**
 * FloatingOverlay - ComponentStack navigator wrapper
 *
 * Demonstrates multiple screen sizes (compact, medium, large, fullscreen)
 * that can navigate between each other with bounds-based transitions.
 */
export function FloatingOverlay() {
	return (
		<View style={styles.overlay} pointerEvents="box-none">
			<Stack.Navigator initialRouteName="compact">
				<Stack.Screen
					name="compact"
					component={ScreenCompact}
					options={screenOptions}
				/>
				<Stack.Screen
					name="medium"
					component={ScreenMedium}
					options={screenOptions}
				/>
				<Stack.Screen
					name="large"
					component={ScreenLarge}
					options={screenOptions}
				/>
				<Stack.Screen
					name="fullscreen"
					component={ScreenFullscreen}
					options={screenOptions}
				/>
				<Stack.Screen
					name="nested"
					component={ScreenNested}
					options={screenOptions}
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
