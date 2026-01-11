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
 * Bounds-based screen interpolator for shared element transitions.
 *
 * This interpolator animates elements between screens by tracking their measured
 * bounds (position + size) and interpolating between source and destination.
 *
 * ## Animated Elements
 *
 * - `BOUNDS_INDICATOR`: Absolutely positioned overlay showing the interpolated
 *   bounds. Useful for debugging or as a mask/clip region.
 *
 * - `FLOATING_ELEMENT`: The actual content element. Uses transform (translateX/Y)
 *   to offset from its natural layout position to the interpolated position.
 *
 * ## Why the Stable Screen Check?
 *
 * The interpolation logic depends on `entering` (derived from `props.next`).
 * When a closing screen is removed from the scene list, `props.next` becomes
 * undefined, flipping `entering` from false → true. This causes:
 *
 * 1. `interpolateBounds` to use a different range (EXIT vs ENTER)
 * 2. `currentBounds` to flip between source/destination
 *
 * Both changes cause the final transform to "snap" unexpectedly.
 *
 * The fix: when a screen is stable (progress=1, not closing), bypass the
 * interpolation entirely and return the screen's own snapshot bounds with
 * zero transform. The element just sits at its natural position.
 */
const boundsInterpolator = (props: ScreenInterpolationProps) => {
	"worklet";

	const { bounds, progress } = props;
	const isClosing = !!props.current?.closing;

	const screenKey = props.current?.route?.key ?? "";
	const link = bounds.getLink("FLOATING_ELEMENT");
	const hasLink = !!(link?.source || link?.destination);

	//
	// ━━━ STABLE SCREEN (or initial with no link) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
	// When progress=1 and not closing, OR when there's no link data (initial screen),
	// return snapshot bounds directly - no interpolation, no transforms.
	//
	if ((progress === 1 && !isClosing) || !hasLink) {
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
			},
			FLOATING_ELEMENT: {
				transform: [{ translateX: 0 }, { translateY: 0 }],
			},
		};
	}

	//
	// ━━━ ANIMATING SCREEN ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
	// Interpolate between source and destination bounds based on progress.
	//

	const entering = !props.next;

	// Interpolated bounds: animates source → destination
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

	// Current screen's natural position (where it sits in layout without transforms)
	// - entering=true (no next screen): this screen is destination
	// - entering=false (has next screen): this screen is source
	//
	const currentBounds = entering
		? link?.destination?.bounds
		: link?.source?.bounds;
	const currentPageX = currentBounds?.pageX ?? 0;
	const currentPageY = currentBounds?.pageY ?? 0;

	// Transform = offset from natural position to interpolated position
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
