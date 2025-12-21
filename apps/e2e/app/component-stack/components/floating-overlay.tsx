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
 * Animates both the BOUNDS_INDICATOR and the FLOATING_ELEMENT content.
 */
const boundsInterpolator = (props: ScreenInterpolationProps) => {
	"worklet";

	const { bounds, progress } = props;
	const isClosing = !!props.current?.closing;

	// If we're stable at progress=1 and not closing, stay at natural position
	// This prevents snapping when a closing screen above us is removed
	if (progress === 1 && !isClosing) {
		// Get this screen's own registered bounds (not from link, which may reference other screens)
		const screenKey = props.current?.route?.key ?? "";
		const snapshot = bounds.getSnapshot("FLOATING_ELEMENT", screenKey);
		const myBounds = snapshot?.bounds;
		return {
			BOUNDS_INDICATOR: {
				height: myBounds?.height ?? 0,
				width: myBounds?.width ?? 0,
				transform: [
					{ translateX: myBounds?.pageX ?? 0 },
					{ translateY: myBounds?.pageY ?? 0 },
				],
				opacity: 1,
			},
			FLOATING_ELEMENT: {
				transform: [{ translateX: 0 }, { translateY: 0 }],
				opacity: 1,
			},
		};
	}

	const entering = !props.next;

	// Get interpolated position (animates between source and destination)
	const interpolatedPageX = bounds.interpolateBounds(
		"FLOATING_ELEMENT",
		"pageX",
		0,
	);
	const interpolatedPageY = bounds.interpolateBounds(
		"FLOATING_ELEMENT",
		"pageY",
		0,
	);
	const interpolatedWidth = bounds.interpolateBounds(
		"FLOATING_ELEMENT",
		"width",
		0,
	);
	const interpolatedHeight = bounds.interpolateBounds(
		"FLOATING_ELEMENT",
		"height",
		0,
	);

	// Get current screen's natural position (where element sits without animation)
	const link = bounds.getLink("FLOATING_ELEMENT");
	const currentBounds = entering
		? link?.destination?.bounds
		: link?.source?.bounds;
	const currentPageX = currentBounds?.pageX ?? 0;
	const currentPageY = currentBounds?.pageY ?? 0;

	// Calculate offset from natural position to interpolated position
	const translateX = interpolatedPageX - currentPageX;
	const translateY = interpolatedPageY - currentPageY;

	return {
		BOUNDS_INDICATOR: {
			height: interpolatedHeight,
			width: interpolatedWidth,
			transform: [
				{ translateX: interpolatedPageX },
				{ translateY: interpolatedPageY },
			],
			opacity: interpolate(progress, [0, 1, 2], [0, 1, 0]),
		},
		FLOATING_ELEMENT: {
			transform: [{ translateX }, { translateY }],
			opacity: interpolate(progress, [0, 1, 2], [0, 1, 0]),
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
