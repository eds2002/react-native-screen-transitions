import { StyleSheet, View } from "react-native";
import {
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
	gestureEnabled: boolean;
}

/**
 * Provider that creates gesture handling for a screen.
 * When gestures are enabled, wraps children in GestureDetector and provides context.
 * When disabled, renders children directly without the gesture provider.
 */
export const {
	ScreenGestureProvider,
	useScreenGestureContext: useGestureContext,
} = createProvider("ScreenGesture", { guarded: false })<
	{ children: React.ReactNode },
	GestureContextType
>(({ children }) => {
	const { current } = useKeys();
	const ancestorContext = useGestureContext();
	const scrollConfig = useSharedValue<ScrollConfig | null>(null);

	const hasGestures = current.options.gestureEnabled === true;

	const { panGesture, nativeGesture, gestureAnimationValues } =
		useBuildGestures({
			scrollConfig,
			ancestorContext,
		});

	const value: GestureContextType = {
		panGesture,
		scrollConfig,
		nativeGesture,
		gestureAnimationValues,
		ancestorContext,
		gestureEnabled: hasGestures,
	};

	const content = <View style={styles.container}>{children}</View>;

	return {
		value,
		children: ({ ScreenGestureProvider }) => {
			// ALWAYS wrap with ScreenGestureProvider so children get THIS screen's context
			// (not ancestor's). Otherwise scrollables would use ancestor's nativeGesture
			// which competes with ancestor's panGesture.
			if (!hasGestures) {
				return <ScreenGestureProvider>{content}</ScreenGestureProvider>;
			}
			return (
				<ScreenGestureProvider>
					<GestureDetector gesture={panGesture}>{content}</GestureDetector>
				</ScreenGestureProvider>
			);
		},
	};
});

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});
