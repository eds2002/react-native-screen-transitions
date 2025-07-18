import { useMemo } from "react";
import { GestureDetector } from "react-native-gesture-handler";
import { useSharedValue } from "react-native-reanimated";
import {
	GestureContext,
	type GestureContextType,
	type ScrollProgress,
} from "../contexts/gesture";
import { useBuildGestures } from "../hooks/use-build-gestures";

type TransitionGestureHandlerProviderProps = {
	children: React.ReactNode;
};

export const TransitionGestureHandlerProvider = ({
	children,
}: TransitionGestureHandlerProviderProps) => {
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
		<GestureContext.Provider value={value}>
			<GestureDetector gesture={panGesture}>{children}</GestureDetector>
		</GestureContext.Provider>
	);
};
