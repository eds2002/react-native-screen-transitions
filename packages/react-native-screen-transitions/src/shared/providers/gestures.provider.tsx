import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import {
	Gesture,
	GestureDetector,
	type GestureType,
} from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import { useSharedValue } from "react-native-reanimated";
import { useBuildGestures } from "../hooks/gestures/use-build-gestures";
import type { GestureStoreMap } from "../stores/gesture.store";
import createProvider from "../utils/create-provider";
import { useKeys } from "./keys.provider";

export type ScrollConfig = {
	x: number;
	y: number;
	contentHeight: number;
	contentWidth: number;
	layoutHeight: number;
	layoutWidth: number;
};

export interface GestureContextType {
	panGesture: GestureType;
	nativeGesture: GestureType;
	scrollConfig: SharedValue<ScrollConfig | null>;
	gestureAnimationValues: GestureStoreMap;
	ancestorContext: GestureContextType | null;
}

/**
 * Provider that creates gesture handling for a screen.
 * If the current screen doesn't have gestures enabled but an ancestor does,
 * we pass through the ancestor's context so scrollable children can coordinate
 * with the ancestor's gestures.
 */
export const {
	ScreenGestureProvider,
	useScreenGestureContext: useGestureContext,
} = createProvider("ScreenGesture", { guarded: false })<
	{ children: React.ReactNode },
	GestureContextType
>(({ children }) => {
	const ancestorContext = useGestureContext();
	const { current } = useKeys();
	const scrollConfig = useSharedValue<ScrollConfig | null>(null);

	const hasOwnGestures = current.options.gestureEnabled === true;
	const shouldPassthrough = !hasOwnGestures && !!ancestorContext;

	const { panGesture, nativeGesture, gestureAnimationValues } =
		useBuildGestures({
			scrollConfig,
			ancestorContext,
		});

	const value: GestureContextType = shouldPassthrough
		? ancestorContext
		: {
				panGesture,
				scrollConfig,
				nativeGesture,
				gestureAnimationValues,
				ancestorContext,
			};

	// When passing through, use a no-op gesture to avoid conflicts.
	// Attaching the same gesture to multiple GestureDetectors causes issues.
	const noOpGesture = useMemo(() => Gesture.Pan().enabled(false), []);
	const activeGesture = shouldPassthrough ? noOpGesture : panGesture;

	return {
		value,
		children: (
			<GestureDetector gesture={activeGesture}>
				<View style={styles.container}>{children}</View>
			</GestureDetector>
		),
	};
});

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});
