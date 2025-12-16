import { StyleSheet, View } from "react-native";
import {
	GestureDetector,
	type GestureType,
} from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import { useSharedValue } from "react-native-reanimated";
import { useBuildGestures } from "../../shared/hooks/gestures/use-build-gestures";
import { useKeys } from "../../shared/providers/keys.provider";
import type { GestureStoreMap } from "../../shared/stores/gesture.store";
import createProvider from "../../shared/utils/create-provider";
import { useComponentNavigationContext } from "../utils/with-component-navigation";

export type ScrollConfig = {
	x: number;
	y: number;
	contentHeight: number;
	contentWidth: number;
	layoutHeight: number;
	layoutWidth: number;
};

export interface ComponentGestureContextType {
	panGesture: GestureType;
	panGestureRef: React.MutableRefObject<GestureType | undefined>;
	nativeGesture: GestureType;
	scrollConfig: SharedValue<ScrollConfig | null>;
	gestureAnimationValues: GestureStoreMap;
	ancestorContext: ComponentGestureContextType | null;
	gestureEnabled: boolean;
}

export const {
	ComponentGestureProvider,
	useComponentGestureContext,
} = createProvider("ComponentGesture", { guarded: false })<
	{ children: React.ReactNode },
	ComponentGestureContextType
>(({ children }) => {
	const { current } = useKeys();
	const { navigation } = useComponentNavigationContext();
	const ancestorContext = useComponentGestureContext();
	const scrollConfig = useSharedValue<ScrollConfig | null>(null);

	const hasGestures = current.options.gestureEnabled === true;

	// Custom dismiss handler that uses component navigation instead of React Navigation
	const handleDismiss = () => {
		if (navigation.canGoBack()) {
			navigation.pop();
		}
	};

	const { panGesture, panGestureRef, nativeGesture, gestureAnimationValues } =
		useBuildGestures({
			scrollConfig,
			ancestorContext,
			onDismiss: handleDismiss,
		});

	const value: ComponentGestureContextType = {
		panGesture,
		panGestureRef,
		scrollConfig,
		nativeGesture,
		gestureAnimationValues,
		ancestorContext,
		gestureEnabled: hasGestures,
	};

	return {
		value,
		children: (
			<GestureDetector gesture={panGesture}>
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
