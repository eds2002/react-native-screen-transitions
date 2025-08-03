import { useMemo } from "react";
import { View } from "react-native";
import {
	GestureDetector,
	GestureHandlerRootView,
} from "react-native-gesture-handler";
import { useSharedValue } from "react-native-reanimated";
import {
	GestureContext,
	type GestureContextType,
	type ScrollProgress,
} from "../../context/gestures";
import { useBuildGestures } from "../../hooks/use-build-gestures";

type ScreenGestureProviderProps = {
	children: React.ReactNode;
};

export const ScreenGestureProvider = ({
	children,
}: ScreenGestureProviderProps) => {
	const scrollProgress = useSharedValue<ScrollProgress>({
		x: 0,
		y: 0,
		contentHeight: 0,
		contentWidth: 0,
		layoutHeight: 0,
		layoutWidth: 0,
	});
	const { panGesture, nativeGesture } = useBuildGestures({
		scrollProgress,
	});

	const value = useMemo(() => {
		return {
			panGesture,
			scrollProgress,
			nativeGesture,
		};
	}, [panGesture, scrollProgress, nativeGesture]) satisfies GestureContextType;

	return (
		<GestureHandlerRootView>
			<GestureContext.Provider value={value}>
				<GestureDetector gesture={panGesture}>
					<View style={{ flex: 1 }}>{children}</View>
				</GestureDetector>
			</GestureContext.Provider>
		</GestureHandlerRootView>
	);
};
